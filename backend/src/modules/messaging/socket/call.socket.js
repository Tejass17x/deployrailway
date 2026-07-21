const logger = require('../../../common/logger/winston');
const CallHistory = require('../../../models/CallHistory');
const redisClient = require('../../../config/redis');

// In-memory fallback map for active calls when Redis is unavailable
const memoryActiveCalls = new Map(); // userId -> { callId, peerId, status, role }
const activeTimeouts = new Map();   // callId -> setTimeout ID

/**
 * Helper to check if a user is currently in a call
 */
const isUserInCall = async (userId) => {
  const userIdStr = userId.toString();
  if (redisClient && redisClient.isOpen && redisClient.isReady) {
    try {
      const activeCall = await redisClient.get(`user:${userIdStr}:active_call`);
      return !!activeCall;
    } catch (err) {
      logger.error(`Redis query user active call failed: ${err.message}`);
    }
  }
  return memoryActiveCalls.has(userIdStr);
};

/**
 * Helper to save active call state
 */
const setActiveCall = async (userId, callDetails) => {
  const userIdStr = userId.toString();
  if (redisClient && redisClient.isOpen && redisClient.isReady) {
    try {
      await redisClient.set(`user:${userIdStr}:active_call`, JSON.stringify(callDetails), { EX: 3600 }); // 1 hour safety TTL
      return;
    } catch (err) {
      logger.error(`Redis set user active call failed: ${err.message}`);
    }
  }
  memoryActiveCalls.set(userIdStr, callDetails);
};

/**
 * Helper to remove active call state
 */
const removeActiveCall = async (userId) => {
  const userIdStr = userId.toString();
  if (redisClient && redisClient.isOpen && redisClient.isReady) {
    try {
      await redisClient.del(`user:${userIdStr}:active_call`);
      return;
    } catch (err) {
      logger.error(`Redis del user active call failed: ${err.message}`);
    }
  }
  memoryActiveCalls.delete(userIdStr);
};

module.exports = (io, socket) => {
  const userId = socket.user?.userId || socket.user?.id || socket.user?._id;
  if (!userId) {
    logger.warn(`socket.user is missing userId properties for call socket: ${socket.id}`);
    return;
  }

  const userIdStr = userId.toString();

  /**
   * 1. CALL_INVITE (or call:initiate)
   * Caller initiates WebRTC call session
   */
  const handleCallInvite = async ({ targetUserId, type, conversationId, callId }) => {
    if (!targetUserId) return;
    const targetUserIdStr = targetUserId.toString();
    const callerIdStr = userIdStr;

    try {
      // Check if target user is busy
      const isBusy = await isUserInCall(targetUserIdStr);
      if (isBusy) {
        logger.info(`📞 Calling: User ${targetUserIdStr} is busy. Rejecting call request from ${callerIdStr}.`);
        socket.emit('CALL_BUSY', { targetUserId: targetUserIdStr, callId });
        socket.emit('call:rejected', { callId, reason: 'busy' });
        
        // Update existing CallHistory record status to busy
        const call = await CallHistory.findOne({ callId });
        if (call) {
          call.status = 'busy';
          call.endedAt = new Date();
          call.duration = 0;
          await call.save();
        }
        return;
      }

      // Check if target user is online
      const presenceManager = require('../../../socket/presence/presence.manager');
      const targetOnline = await presenceManager.isUserOnline(targetUserIdStr);
      if (!targetOnline) {
        logger.info(`📞 Calling: Target User ${targetUserIdStr} is offline.`);
        socket.emit('CALL_TIMEOUT', { callId });
        socket.emit('call:rejected', { callId, reason: 'offline' });
        
        const call = await CallHistory.findOne({ callId });
        if (call) {
          call.status = 'missed';
          call.endedAt = new Date();
          call.duration = 0;
          await call.save();
        }
        return;
      }

      logger.info(`📞 Call Invite: User ${callerIdStr} (Socket: ${socket.id}) is calling ${targetUserIdStr} (CallId: ${callId})`);

      // Set active call status in Redis/Memory with specific socket IDs
      const callDetails = { callId, type: type || 'voice', peerId: targetUserIdStr };
      await setActiveCall(callerIdStr, { ...callDetails, role: 'caller', status: 'ringing', socketId: socket.id });
      await setActiveCall(targetUserIdStr, { ...callDetails, role: 'callee', status: 'ringing' });

      // Find or create CallHistory record
      let callRecord = await CallHistory.findOne({ callId });
      if (!callRecord) {
        const { v4: uuidv4 } = require('uuid');
        callRecord = new CallHistory({
          callId: callId || uuidv4(),
          caller: userId,
          receiver: targetUserId,
          status: 'missed', // default to missed in case they timeout
          type: type || 'voice',
          participants: [userId, targetUserId],
          startedAt: new Date()
        });
        await callRecord.save();
      }

      // Relay CALL_INVITE (and call:incoming) to receiver's room with caller's socket ID
      const inviteData = {
        callerId: userId,
        callerName: socket.user.fullName || 'Researcher',
        callerImage: socket.user.profileImage || '',
        callId: callRecord.callId,
        type: type || 'voice',
        conversationId,
        callerSocketId: socket.id // Relay caller's specific socket ID
      };

      io.to(`user:${targetUserIdStr}`).emit('CALL_INVITE', inviteData);
      io.to(`user:${targetUserIdStr}`).emit('call:incoming', inviteData);

      // Set 30 seconds timer for Missed Call / Timeout
      const timeoutId = setTimeout(async () => {
        try {
          logger.info(`📞 Call Timeout: CallId ${callRecord.callId} timed out after 30 seconds.`);
          
          // Clear active keys
          await removeActiveCall(callerIdStr);
          await removeActiveCall(targetUserIdStr);
          
          // Update database record
          const currentRecord = await CallHistory.findOne({ callId: callRecord.callId });
          if (currentRecord && currentRecord.status === 'missed') {
            currentRecord.endedAt = new Date();
            currentRecord.duration = 0;
            await currentRecord.save();
          }

          // Emit timeout events
          io.to(`user:${callerIdStr}`).emit('CALL_TIMEOUT', { callId: callRecord.callId });
          io.to(`user:${targetUserIdStr}`).emit('CALL_TIMEOUT', { callId: callRecord.callId });

          io.to(`user:${callerIdStr}`).emit('call:rejected', { callId: callRecord.callId, reason: 'timeout' });
          io.to(`user:${targetUserIdStr}`).emit('call:hungup', { callId: callRecord.callId });
          
          activeTimeouts.delete(callRecord.callId.toString());
        } catch (timerErr) {
          logger.error(`Error during call timeout scheduler execution: ${timerErr.message}`);
        }
      }, 30000);

      activeTimeouts.set(callRecord.callId.toString(), timeoutId);

    } catch (err) {
      logger.error(`Failed to initiate call via socket: ${err.message}`);
    }
  };

  socket.on('call:initiate', handleCallInvite);
  socket.on('CALL_INVITE', handleCallInvite);

  /**
   * 2. CALL_RINGING
   * Callee lets caller know that call invitation has been shown and is ringing
   */
  const handleCallRinging = ({ callerId, callId, targetSocketId }) => {
    if (!callerId) return;
    if (targetSocketId) {
      io.to(targetSocketId).emit('CALL_RINGING', { callId });
    } else {
      io.to(`user:${callerId}`).emit('CALL_RINGING', { callId });
    }
  };
  socket.on('CALL_RINGING', handleCallRinging);

  /**
   * 3. CALL_ACCEPT (or call:accept)
   * Callee accepts WebRTC call
   */
  const handleCallAccept = async ({ callerId, callId, targetSocketId }) => {
    if (!callId) return;
    const callIdStr = callId.toString();

    try {
      // Clear timeout
      if (activeTimeouts.has(callIdStr)) {
        clearTimeout(activeTimeouts.get(callIdStr));
        activeTimeouts.delete(callIdStr);
      }

      // Update call states in Redis/Memory to active
      const callerIdStr = callerId.toString();
      await setActiveCall(callerIdStr, { callId, status: 'active', role: 'caller', peerId: userIdStr, socketId: targetSocketId, peerSocketId: socket.id });
      await setActiveCall(userIdStr, { callId, status: 'active', role: 'callee', peerId: callerIdStr, socketId: socket.id, peerSocketId: targetSocketId });

      // Update CallHistory in MongoDB
      const call = await CallHistory.findOne({ callId });
      if (call) {
        call.status = 'completed'; // default final status if completes successfully
        await call.save();
      }

      logger.info(`📞 Call Accepted: User ${userIdStr} accepted CallId ${callId}`);

      // Broadcast to other tabs of this callee user that the call was answered elsewhere
      socket.to(`user:${userIdStr}`).emit('CALL_ANSWERED_ELSEWHERE', { callId });

      // Relay acceptance specifically to the caller's socket or room
      const acceptData = { callId, accepterId: userId, accepterSocketId: socket.id };
      if (targetSocketId) {
        io.to(targetSocketId).emit('CALL_ACCEPT', acceptData);
        io.to(targetSocketId).emit('call:accepted', acceptData);
      } else {
        io.to(`user:${callerId}`).emit('CALL_ACCEPT', acceptData);
        io.to(`user:${callerId}`).emit('call:accepted', acceptData);
      }
    } catch (err) {
      logger.error(`Failed to accept call via socket: ${err.message}`);
    }
  };

  socket.on('call:accept', handleCallAccept);
  socket.on('CALL_ACCEPT', handleCallAccept);

  /**
   * 4. CALL_REJECT (or call:reject)
   * Callee rejects incoming call invitation
   */
  const handleCallReject = async ({ callerId, callId, targetSocketId }) => {
    if (!callId) return;
    const callIdStr = callId.toString();

    try {
      // Clear timeout
      if (activeTimeouts.has(callIdStr)) {
        clearTimeout(activeTimeouts.get(callIdStr));
        activeTimeouts.delete(callIdStr);
      }

      // Clean active call references
      const callerIdStr = callerId.toString();
      await removeActiveCall(callerIdStr);
      await removeActiveCall(userIdStr);

      // Update CallHistory DB record
      const call = await CallHistory.findOne({ callId });
      if (call) {
        call.status = 'rejected';
        call.endedAt = new Date();
        call.duration = 0;
        await call.save();
      }

      logger.info(`📞 Call Rejected: User ${userIdStr} rejected CallId ${callId}`);

      // Relay reject to specific socket or broad room
      const rejectData = { callId, rejecterId: userId };
      if (targetSocketId) {
        io.to(targetSocketId).emit('CALL_REJECT', rejectData);
        io.to(targetSocketId).emit('call:rejected', rejectData);
      } else {
        io.to(`user:${callerId}`).emit('CALL_REJECT', rejectData);
        io.to(`user:${callerId}`).emit('call:rejected', rejectData);
      }
    } catch (err) {
      logger.error(`Failed to reject call via socket: ${err.message}`);
    }
  };

  socket.on('call:reject', handleCallReject);
  socket.on('CALL_REJECT', handleCallReject);

  /**
   * 5. CALL_CANCEL
   * Caller cancels call before receiver answers
   */
  const handleCallCancel = async ({ targetUserId, callId, targetSocketId }) => {
    if (!callId) return;
    const callIdStr = callId.toString();

    try {
      if (activeTimeouts.has(callIdStr)) {
        clearTimeout(activeTimeouts.get(callIdStr));
        activeTimeouts.delete(callIdStr);
      }

      const targetUserIdStr = targetUserId.toString();
      await removeActiveCall(userIdStr);
      await removeActiveCall(targetUserIdStr);

      const call = await CallHistory.findOne({ callId });
      if (call) {
        call.status = 'cancelled';
        call.endedAt = new Date();
        call.duration = 0;
        await call.save();
      }

      logger.info(`📞 Call Cancelled: Caller ${userIdStr} cancelled CallId ${callId}`);

      const cancelData = { callId, cancellerId: userId };
      if (targetSocketId) {
        io.to(targetSocketId).emit('CALL_CANCEL', cancelData);
        io.to(targetSocketId).emit('call:hungup', cancelData);
      } else {
        io.to(`user:${targetUserIdStr}`).emit('CALL_CANCEL', cancelData);
        io.to(`user:${targetUserIdStr}`).emit('call:hungup', cancelData);
      }
    } catch (err) {
      logger.error(`Failed to cancel call via socket: ${err.message}`);
    }
  };
  socket.on('CALL_CANCEL', handleCallCancel);

  /**
   * 6. CALL_END (or call:hangup)
   * Active call gets hung up by either party
   */
  const handleCallEnd = async ({ targetUserId, callId, targetSocketId, iceState, connectionState }) => {
    if (!callId) return;
    const callIdStr = callId.toString();

    try {
      if (activeTimeouts.has(callIdStr)) {
        clearTimeout(activeTimeouts.get(callIdStr));
        activeTimeouts.delete(callIdStr);
      }

      const targetUserIdStr = targetUserId.toString();
      await removeActiveCall(userIdStr);
      await removeActiveCall(targetUserIdStr);

      const call = await CallHistory.findOne({ callId });
      if (call) {
        call.endedAt = new Date();
        call.duration = Math.max(0, Math.round((call.endedAt - call.startedAt) / 1000));
        
        // Only set completed if it was accepted and running
        if (call.status !== 'rejected' && call.status !== 'cancelled' && call.status !== 'busy') {
          call.status = 'completed';
        }
        
        if (iceState) call.iceState = iceState;
        if (connectionState) call.connectionState = connectionState;
        
        await call.save();
      }

      logger.info(`📞 Call End: User ${userIdStr} hung up CallId ${callId}`);

      const endData = { callId, hangupperId: userId };
      if (targetSocketId) {
        io.to(targetSocketId).emit('CALL_END', endData);
        io.to(targetSocketId).emit('call:hungup', endData);
      } else {
        io.to(`user:${targetUserIdStr}`).emit('CALL_END', endData);
        io.to(`user:${targetUserIdStr}`).emit('call:hungup', endData);
      }
    } catch (err) {
      logger.error(`Failed to hang up call via socket: ${err.message}`);
    }
  };

  socket.on('call:hangup', handleCallEnd);
  socket.on('CALL_END', handleCallEnd);

  /**
   * 7. WebRTC Signaling relay (offers, answers, ICE candidates)
   */
  socket.on('call:signal', async ({ targetSocketId, signal, callId }) => {
    if (!targetSocketId) return;

    // Relay compatibility signals
    io.to(targetSocketId).emit('call:signal', {
      senderId: userId,
      senderSocketId: socket.id,
      signal
    });

    // Relay precise specification signals
    if (signal.sdp) {
      if (signal.sdp.type === 'offer') {
        io.to(targetSocketId).emit('WEBRTC_OFFER', { senderId: userId, senderSocketId: socket.id, sdp: signal.sdp, callId });
      } else if (signal.sdp.type === 'answer') {
        io.to(targetSocketId).emit('WEBRTC_ANSWER', { senderId: userId, senderSocketId: socket.id, sdp: signal.sdp, callId });
      }
    } else if (signal.candidate) {
      io.to(targetSocketId).emit('ICE_CANDIDATE', { senderId: userId, senderSocketId: socket.id, candidate: signal.candidate, callId });
    }
  });

  // Explicit events relay targeting specific sockets
  socket.on('WEBRTC_OFFER', async ({ targetSocketId, sdp, callId }) => {
    if (!targetSocketId) return;
    io.to(targetSocketId).emit('WEBRTC_OFFER', { senderId: userId, senderSocketId: socket.id, sdp, callId });
  });

  socket.on('WEBRTC_ANSWER', async ({ targetSocketId, sdp, callId }) => {
    if (!targetSocketId) return;
    io.to(targetSocketId).emit('WEBRTC_ANSWER', { senderId: userId, senderSocketId: socket.id, sdp, callId });
  });

  socket.on('ICE_CANDIDATE', async ({ targetSocketId, candidate, callId }) => {
    if (!targetSocketId) return;
    io.to(targetSocketId).emit('ICE_CANDIDATE', { senderId: userId, senderSocketId: socket.id, candidate, callId });
  });

  /**
   * 8. MEDIA_STATE_CHANGED
   * Relay microphone, camera, and screen sharing state updates to the peer's specific socket
   */
  socket.on('MEDIA_STATE_CHANGED', ({ targetSocketId, targetUserId, micActive, videoActive, screenSharing }) => {
    const payload = {
      senderId: userId,
      senderSocketId: socket.id,
      micActive,
      videoActive,
      screenSharing
    };
    if (targetSocketId) {
      io.to(targetSocketId).emit('MEDIA_STATE_CHANGED', payload);
    } else if (targetUserId) {
      io.to(`user:${targetUserId}`).emit('MEDIA_STATE_CHANGED', payload);
    }
  });

  /**
   * 9. DISCONNECT CLEANUP
   * If a socket disconnects, automatically clean up any active calls they were in.
   */
  socket.on('disconnect', async () => {
    try {
      logger.info(`📞 Calling: Socket ${socket.id} (User ${userIdStr}) disconnected. Cleaning up active calls.`);
      
      let activeCall = null;
      if (redisClient && redisClient.isOpen && redisClient.isReady) {
        const activeCallStr = await redisClient.get(`user:${userIdStr}:active_call`);
        if (activeCallStr) {
          activeCall = JSON.parse(activeCallStr);
        }
      } else {
        activeCall = memoryActiveCalls.get(userIdStr);
      }

      if (activeCall && activeCall.socketId === socket.id) {
        logger.info(`📞 Calling: Active call ${activeCall.callId} disconnected on socket ${socket.id}. Hanging up peer.`);
        await handleCallEnd({ 
          targetUserId: activeCall.peerId, 
          callId: activeCall.callId,
          targetSocketId: activeCall.peerSocketId
        });
      }
    } catch (err) {
      logger.error(`Error during calling disconnect cleanup: ${err.message}`);
    }
  });
};
