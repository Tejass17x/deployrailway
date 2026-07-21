const mongoose = require('mongoose');
const Connection = require('../../../models/Connection');
const Follow = require('../../../models/Follow');
const User = require('../../../models/User');
const Profile = require('../../../models/Profile');
const Presence = require('../../../socket/presence/Presence');
const ConnectionRequest = require('../../connections/model/ConnectionRequest');
const { ValidationError, UnauthorizedError } = require('../../../common/errors/AppError');
const messageRepository = require('../repository/message.repository');
const Conversation = require('../model/Conversation');
const Message = require('../model/Message');
const PinnedChat = require('../model/PinnedChat');
const ArchivedChat = require('../model/ArchivedChat');
const MessageAttachment = require('../model/MessageAttachment');
const MessageReaction = require('../model/MessageReaction');
const CallHistory = require('../../../models/CallHistory');
const { emitToUser, emitToRoom, isUserOnline } = require('../../../config/socket');
const logger = require('../../../common/logger/winston');

class MessageService {
  /**
   * Resolve a identifier (ObjectId, username, or profileSlug) to a User ID
   */
  async resolveUserId(identifier) {
    if (!identifier) return null;
    const identifierStr = identifier.toString();

    // Check if it is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(identifierStr)) {
      return new mongoose.Types.ObjectId(identifierStr);
    }

    // Search user by username, profileSlug, or slug
    const user = await User.findOne({
      $or: [
        { username: identifierStr },
        { profileSlug: identifierStr },
        { slug: identifierStr }
      ],
      isDeleted: { $ne: true }
    }).select('_id').lean();

    if (!user) {
      throw new ValidationError(`User with identifier '${identifierStr}' not found.`);
    }

    return user._id;
  }

  /**
   * Check if two users are allowed to chat:
   * - Accepted connections, OR
   * - One party follows the other (mutual or one-way)
   */
  async checkCanChat(userA, userB) {
    const aId = new mongoose.Types.ObjectId(userA);
    const bId = new mongoose.Types.ObjectId(userB);

    // Check accepted connection (order-independent)
    const isConnected = await Connection.findOne({
      $or: [
        { researcherA: aId, researcherB: bId },
        { researcherA: bId, researcherB: aId }
      ]
    }).lean();
    if (isConnected) return true;

    // Check follow relationship (either direction)
    const followExists = await Follow.findOne({
      $or: [
        { followerId: aId, followingId: bId },
        { followerId: bId, followingId: aId }
      ]
    }).lean();

    return !!followExists;
  }

  /**
   * Start or retrieve a conversation (enforces chat permission)
   */
  async getOrCreateConversation(userId, targetUserId) {
    const resolvedTargetId = await this.resolveUserId(targetUserId);

    if (userId.toString() === resolvedTargetId.toString()) {
      throw new ValidationError('Cannot chat with yourself.');
    }

    const canChat = await this.checkCanChat(userId, resolvedTargetId);
    if (!canChat) {
      throw new ValidationError('You can only message researchers you are connected with or follow.');
    }

    let conv = await Conversation.findOne({
      participants: { $all: [userId, resolvedTargetId] }
    });

    if (!conv) {
      conv = new Conversation({
        participants: [userId, resolvedTargetId],
        conversationType: 'Direct',
        createdBy: userId,
        unreadCounts: { [userId.toString()]: 0, [resolvedTargetId.toString()]: 0 }
      });
      await conv.save();
    }
    return conv;
  }

  /**
   * Send a new message
   */
  async sendMessage(userId, { conversationId, receiverId, type = 'text', text, attachmentId, replyTo }) {
    let conv;
    const userIdStr = userId.toString();

    if (conversationId) {
      conv = await Conversation.findById(conversationId);
      if (!conv) {
        throw new ValidationError('Conversation not found.');
      }
      if (!conv.participants.map(p => p.toString()).includes(userIdStr)) {
        throw new UnauthorizedError('Unauthorized access to this conversation.');
      }
      const otherId = conv.participants.find(p => p.toString() !== userIdStr);
      receiverId = otherId ? await this.resolveUserId(otherId) : null;
    } else if (receiverId) {
      receiverId = await this.resolveUserId(receiverId);
      conv = await this.getOrCreateConversation(userId, receiverId);
      conversationId = conv._id;
    } else {
      throw new ValidationError('Either conversationId or receiverId must be supplied.');
    }

    const receiverIdStr = receiverId.toString();
    const isOnline = await isUserOnline(receiverIdStr);
    const messageStatus = isOnline ? 'delivered' : 'sent';
    const deliveryDate = isOnline ? new Date() : null;

    // Ensure text is always a string (fallback to empty)
    const messageText = (text || '').toString();

    // Create the message
    const message = new Message({
      conversationId,
      senderId: userId,
      receiverId,
      type: type || 'text',
      messageType: type || 'text',
      text: messageText,
      message: messageText,
      attachment: attachmentId || null,
      attachmentId: attachmentId || null,
      replyTo: replyTo || null,
      status: messageStatus,
      deliveredAt: deliveryDate
    });

    await message.save();

    // Populate attachment details if it exists
    if (attachmentId) {
      await MessageAttachment.findByIdAndUpdate(attachmentId, { messageId: message._id });
    }

    // Update conversation metadata and increment unread counts
    const updateQuery = {
      $set: {
        lastMessage: text || (type === 'image' ? 'Shared an image' : 'Shared a file'),
        lastMessageId: message._id,
        lastSender: userId,
        lastMessageTime: message.createdAt
      }
    };

    // Increment unread count for other participants
    conv.participants.forEach(p => {
      const pidStr = p.toString();
      if (pidStr !== userIdStr) {
        updateQuery.$inc = updateQuery.$inc || {};
        updateQuery.$inc[`unreadCounts.${pidStr}`] = 1;
      }
    });

    await Conversation.findByIdAndUpdate(conversationId, updateQuery);

    // Optimize: Avoid findById and populate queries if there are no attachments or replies (Requirement 5)
    const populateFields = [
      { path: 'senderId', select: 'firstName lastName profileImage username profileSlug slug' }
    ];
    if (attachmentId) {
      populateFields.push({ path: 'attachment' });
      populateFields.push({ path: 'attachmentId' });
    }
    if (replyTo) {
      populateFields.push({ path: 'replyTo' });
    }

    const populated = await Message.findById(message._id)
      .populate(populateFields)
      .lean();

    // Emit live events to both users
    // Emit new message event to the conversation room using both event names
    emitToRoom(`conversation:${conversationId}`, 'message:new', populated);
    emitToRoom(`conversation:${conversationId}`, 'receiveMessage', populated);
    emitToRoom(`conversation:${conversationId}`, 'message:received', populated);
    
    // Emit conversation updates to both participants' user rooms to refresh sidebars
    emitToUser(userId, 'conversation:update', { conversationId, lastMessage: populated });
    emitToUser(userId, 'conversationUpdated', { conversationId, lastMessage: populated });
    emitToUser(receiverId, 'conversation:update', { conversationId, lastMessage: populated });
    emitToUser(receiverId, 'conversationUpdated', { conversationId, lastMessage: populated });

    // Emit real-time notification Received if receiver is not in active room
    emitToUser(receiverId, 'notificationReceived', {
      type: 'message',
      title: 'New Message',
      body: text || 'Shared an attachment',
      referenceId: message._id
    });

    // Create persistent system notification asynchronously (non-blocking)
    try {
      const notificationService = require('../../notifications/service/notification.service');
      notificationService.createNotification({
        recipientId: receiverId,
        actorId: userId,
        type: 'message',
        title: 'New Message',
        message: text || 'Shared an attachment',
        targetType: 'User',
        targetId: userId,
        targetUrl: `/messages/${conversationId}`
      }).catch(err => {
        logger.error(`Failed creating message system notification: ${err.message}`);
      });
    } catch (err) {
      logger.error(`Failed locating notificationService: ${err.message}`);
    }

    return populated;
  }

  /**
   * Get all conversations of a user
   */
  async getUserConversations(userId) {
    return await messageRepository.getUserConversations(userId);
  }

  /**
   * Get messages of a conversation with cursor pagination
   */
  async getConversationMessages(userId, conversationId, { limit, cursor }) {
    const conv = await Conversation.findById(conversationId);
    if (!conv) {
      throw new ValidationError('Conversation not found.');
    }
    if (!conv.participants.map(p => p.toString()).includes(userId.toString())) {
      throw new UnauthorizedError('Unauthorized access to this conversation.');
    }

    return await messageRepository.getConversationMessages(conversationId, { limit, cursor, userId });
  }

  /**
   * Mark all messages in a conversation as read by the user
   */
  async markAsRead(userId, conversationId) {
    const userIdStr = userId.toString();
    const conv = await Conversation.findById(conversationId);
    if (!conv) {
      throw new ValidationError('Conversation not found.');
    }
    if (!conv.participants.map(p => p.toString()).includes(userIdStr)) {
      throw new UnauthorizedError('Unauthorized access.');
    }

    const otherParticipantId = conv.participants.find(p => p.toString() !== userIdStr);

    const now = new Date();
    // Update message status to seen for all incoming unread messages in a single query (Requirement 4 & index-backed)
    await Message.updateMany(
      { conversationId, senderId: otherParticipantId, status: { $nin: ['seen', 'read'] } },
      { $set: { status: 'seen', readAt: now } }
    );

    // Reset unread count for the reader in Conversation document
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCounts.${userIdStr}`]: 0 }
    });

    // Notify the sender that messages were read
    emitToUser(otherParticipantId, 'message:read', { conversationId, readBy: userId, readAt: now });
    emitToUser(otherParticipantId, 'messageRead', { conversationId, readBy: userId, readAt: now });
    emitToRoom(`conversation:${conversationId}`, 'messageRead', { conversationId, readBy: userId, readAt: now });
    emitToUser(otherParticipantId, 'message:seen', { conversationId, readBy: userId, readAt: now });
    emitToRoom(`conversation:${conversationId}`, 'message:seen', { conversationId, readBy: userId, readAt: now });

    return { success: true };
  }

  /**
   * Pin a conversation
   */
  async pinConversation(userId, conversationId) {
    const conv = await Conversation.findById(conversationId);
    if (!conv) {
      throw new ValidationError('Conversation not found.');
    }
    
    // Check pin count limit
    const count = await Conversation.countDocuments({
      isPinned: userId
    });
    if (count >= 10) {
      throw new ValidationError('You can pin a maximum of 10 conversations.');
    }

    await Conversation.findByIdAndUpdate(conversationId, {
      $addToSet: { isPinned: userId }
    });

    return { success: true };
  }

  /**
   * Unpin a conversation
   */
  async unpinConversation(userId, conversationId) {
    await Conversation.findByIdAndUpdate(conversationId, {
      $pull: { isPinned: userId }
    });
    return { success: true };
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(userId, conversationId) {
    await Conversation.findByIdAndUpdate(conversationId, {
      $addToSet: { isArchived: userId }
    });
    return { success: true };
  }

  /**
   * Restore/Unarchive a conversation
   */
  async restoreConversation(userId, conversationId) {
    await Conversation.findByIdAndUpdate(conversationId, {
      $pull: { isArchived: userId }
    });
    return { success: true };
  }

  /**
   * Edit a message
   */
  async editMessage(userId, messageId, text) {
    const msg = await Message.findById(messageId);
    if (!msg) {
      throw new ValidationError('Message not found.');
    }
    if (msg.senderId.toString() !== userId.toString()) {
      throw new UnauthorizedError('Cannot edit messages sent by another researcher.');
    }
    if (msg.deleted) {
      throw new ValidationError('Cannot edit a deleted message.');
    }

    msg.text = text;
    msg.message = text;
    msg.edited = true;
    await msg.save();

    const populated = await Message.findById(messageId)
      .populate('senderId', 'firstName lastName profileImage username profileSlug slug')
      .populate('attachment')
      .populate('attachmentId')
      .populate('replyTo')
      .lean();

    emitToRoom(`conversation:${msg.conversationId}`, 'message:update', populated);
    emitToRoom(`conversation:${msg.conversationId}`, 'messageEdited', populated);

    return populated;
  }

  /**
   * Delete a message
   */
  async deleteMessage(userId, messageId, deleteType = 'everyone') {
    const msg = await Message.findById(messageId);
    if (!msg) {
      throw new ValidationError('Message not found.');
    }

    if (deleteType === 'everyone') {
      if (msg.senderId.toString() !== userId.toString()) {
        throw new UnauthorizedError('Cannot delete messages sent by another researcher.');
      }
      msg.deleted = true;
      msg.text = 'This message was deleted';
      msg.message = 'This message was deleted';
      msg.attachment = null;
      msg.attachmentId = null;
      await msg.save();

      const populated = await Message.findById(messageId)
        .populate('senderId', 'firstName lastName profileImage username profileSlug slug')
        .populate('attachment')
        .populate('attachmentId')
        .populate('replyTo')
        .lean();

      emitToRoom(`conversation:${msg.conversationId}`, 'message:update', populated);
      emitToRoom(`conversation:${msg.conversationId}`, 'messageDeleted', { messageId, conversationId: msg.conversationId });
    } else {
      // Delete for me
      if (!msg.deletedBy.map(d => d.toString()).includes(userId.toString())) {
        msg.deletedBy.push(userId);
        await msg.save();
      }
    }

    return { success: true };
  }

  /**
   * Add / update a reaction on a message
   */
  async reactToMessage(userId, messageId, reaction) {
    const msg = await Message.findById(messageId);
    if (!msg) {
      throw new ValidationError('Message not found.');
    }

    await MessageReaction.findOneAndUpdate(
      { messageId, userId },
      { messageId, userId, reaction },
      { upsert: true }
    );

    const populated = await Message.findById(messageId)
      .populate('senderId', 'firstName lastName profileImage username profileSlug slug')
      .populate('attachment')
      .populate('replyTo')
      .lean();

    // Fetch reactions count
    const reactions = await MessageReaction.find({ messageId })
      .populate('userId', 'firstName lastName username profileSlug slug')
      .lean();

    const updatePayload = {
      ...populated,
      reactions
    };

    emitToRoom(`conversation:${msg.conversationId}`, 'message:update', updatePayload);

    return updatePayload;
  }

  /**
   * Search messages
   */
  async searchMessages(userId, query) {
    if (!query || query.trim() === '') {
      throw new ValidationError('Search query must be supplied.');
    }
    return await messageRepository.searchMessages(userId, query.trim());
  }

  /**
   * Create a new group chat
   */
  async createGroup(userId, name, description, participantIds = []) {
    if (!name || name.trim() === '') {
      throw new ValidationError('Group name is required.');
    }

    const uniqueParticipants = Array.from(new Set([userId.toString(), ...participantIds.map(p => p.toString())]));

    const conv = new Conversation({
      participants: uniqueParticipants,
      isGroup: true,
      name: name.trim(),
      description: description ? description.trim() : '',
      admins: [userId]
    });

    await conv.save();

    // Create system join message
    const msg = new Message({
      conversationId: conv._id,
      senderId: userId,
      type: 'system',
      text: `${name} group created.`,
      message: `${name} group created.`
    });
    await msg.save();

    conv.lastMessage = msg._id;
    conv.lastMessageAt = msg.createdAt;
    await conv.save();

    // Populate conversation
    const populated = await Conversation.findById(conv._id)
      .populate('participants', 'firstName lastName username profileSlug slug profileImage')
      .populate('lastMessage')
      .lean();

    // Emit socket updates to all participants
    uniqueParticipants.forEach(pid => {
      emitToUser(pid, 'conversation:update', { conversationId: conv._id, lastMessage: msg });
    });

    // Normalize profileImage for all participants (populate+lean bypasses toJSON)
    if (populated && populated.participants) {
      populated.participants = populated.participants.map(p => ({
        ...p,
        profileImage: p.profileImage?.url || p.profileImage || ''
      }));
    }

    return populated;
  }

  /**
   * Invite members to a group chat
   */
  async inviteToGroup(userId, conversationId, participantIds = []) {
    const conv = await Conversation.findById(conversationId);
    if (!conv) {
      throw new ValidationError('Conversation not found.');
    }
    if (!conv.isGroup) {
      throw new ValidationError('Conversation is not a group.');
    }
    if (!conv.participants.map(p => p.toString()).includes(userId.toString())) {
      throw new UnauthorizedError('Not a member of this group.');
    }

    const currentParticipants = conv.participants.map(p => p.toString());
    const newParticipants = participantIds.map(p => p.toString()).filter(id => !currentParticipants.includes(id));

    if (newParticipants.length > 0) {
      conv.participants.push(...newParticipants);
      await conv.save();

      // Create system join message
      const msg = new Message({
        conversationId: conv._id,
        senderId: userId,
        type: 'system',
        text: `New members added by creator.`,
        message: `New members added by creator.`
      });
      await msg.save();

      conv.lastMessage = msg._id;
      conv.lastMessageAt = msg.createdAt;
      await conv.save();

      // Emit updates to everyone
      const allParticipants = conv.participants.map(p => p.toString());
      allParticipants.forEach(pid => {
        emitToUser(pid, 'conversation:update', { conversationId: conv._id, lastMessage: msg });
      });
    }

    const result = await Conversation.findById(conversationId)
      .populate('participants', 'firstName lastName username profileSlug slug profileImage')
      .populate('lastMessage')
      .lean();

    // Normalize profileImage for all participants (populate+lean bypasses toJSON)
    if (result && result.participants) {
      result.participants = result.participants.map(p => ({
        ...p,
        profileImage: p.profileImage?.url || p.profileImage || ''
      }));
    }

    return result;
  }

  /**
   * Log WebRTC Call Start
   */
  async logCallStart(userId, { type, targetUserId, conversationId }) {
    const { v4: uuidv4 } = require('uuid');
    const callId = uuidv4();
    const call = new CallHistory({
      callId,
      caller: userId,
      receiver: targetUserId,
      status: 'missed',
      type: type || 'voice',
      participants: [userId, targetUserId],
      startedAt: new Date()
    });
    await call.save();
    return call;
  }

  /**
   * Log WebRTC Call End
   */
  async logCallEnd(userId, callId, status) {
    const call = await CallHistory.findOne({ callId });
    if (!call) {
      throw new ValidationError('Call record not found.');
    }

    call.status = status || 'completed';
    call.endedAt = new Date();
    call.duration = Math.max(0, Math.round((call.endedAt - call.startedAt) / 1000));
    await call.save();
    return call;
  }

  /**
   * Get call history logs for the user
   */
  async getCallHistory(userId) {
    const castUserId = new mongoose.Types.ObjectId(userId);
    const calls = await CallHistory.find({ participants: castUserId })
      .populate('caller', 'firstName lastName username profileSlug slug profileImage')
      .populate('receiver', 'firstName lastName username profileSlug slug profileImage')
      .populate('participants', 'firstName lastName username profileSlug slug profileImage')
      .sort({ createdAt: -1 })
      .lean();

    return calls.map(call => ({
      ...call,
      initiatorId: call.caller ? {
        ...call.caller,
        profileImage: call.caller.profileImage?.url || call.caller.profileImage || ''
      } : null,
      caller: call.caller ? {
        ...call.caller,
        profileImage: call.caller.profileImage?.url || call.caller.profileImage || ''
      } : null,
      receiver: call.receiver ? {
        ...call.receiver,
        profileImage: call.receiver.profileImage?.url || call.receiver.profileImage || ''
      } : null,
      participants: Array.isArray(call.participants)
        ? call.participants.map(p => ({
            ...p,
            profileImage: p.profileImage?.url || p.profileImage || ''
          }))
        : []
    }));
  }

  /**
   * Add or remove a reaction on a message
   */
  async reactToMessage(userId, messageId, reaction) {
    const MessageReaction = require('../model/MessageReaction');
    const Message = require('../model/Message');

    const msg = await Message.findById(messageId);
    if (!msg) {
      throw new ValidationError('Message not found.');
    }

    // If reaction string is empty/null, delete the reaction (toggle behavior)
    if (!reaction || reaction.trim() === '') {
      await MessageReaction.findOneAndDelete({ messageId, userId });
    } else {
      await MessageReaction.findOneAndUpdate(
        { messageId, userId },
        { reaction: reaction.trim() },
        { upsert: true, new: true }
      );
    }

    // Fetch all current reactions for this message
    const reactions = await MessageReaction.find({ messageId })
      .select('userId reaction')
      .lean();

    // Emit live reaction event to the conversation room
    emitToRoom(`conversation:${msg.conversationId}`, 'message:reaction', {
      messageId,
      reactions
    });

    return reactions;
  }

  /**
   * Get shared files in user's conversations
   */
  async getSharedFiles(userId) {
    return await messageRepository.getSharedFiles(userId);
  }

  /**
   * Get messaging contacts — merged deduplicated list of:
   * connections, followers, and following;
   * each enriched with online status and existingConversationId.
   */
  async getMessagingContacts(userId) {
    const userIdStr = userId.toString();
    const castUserId = new mongoose.Types.ObjectId(userId);

    // 1. Fetch all three relationship sets in parallel
    const [connections, followers, following, conversations] = await Promise.all([
      Connection.find({ $or: [{ researcherA: castUserId }, { researcherB: castUserId }] }).lean(),
      Follow.find({ followingId: castUserId }).lean(),
      Follow.find({ followerId: castUserId }).lean(),
      Conversation.find({ participants: castUserId, isGroup: false }).select('participants').lean()
    ]);

    // Build conversationId lookup: otherUserId -> conversationId
    const convMap = new Map();
    conversations.forEach(c => {
      const other = c.participants.find(p => p.toString() !== userIdStr);
      if (other) convMap.set(other.toString(), c._id.toString());
    });

    // Extract unique other-user IDs per category
    const connectionIds = connections.map(c =>
      c.researcherA.toString() === userIdStr ? c.researcherB.toString() : c.researcherA.toString()
    );
    const followerIds = followers.map(f => f.followerId.toString());
    const followingIds = following.map(f => f.followingId.toString());

    // Collect all unique user IDs we need to enrich
    const allIds = [...new Set([...connectionIds, ...followerIds, ...followingIds])];
    if (allIds.length === 0) {
      return { connections: [], followers: [], following: [] };
    }

    const objectIds = allIds.map(id => new mongoose.Types.ObjectId(id));

    // 2. Bulk fetch users + profiles + presences (resolve N+1 online check)
    const [users, profiles, presences] = await Promise.all([
      User.find({ _id: { $in: objectIds }, isDeleted: { $ne: true } })
        .select('_id firstName lastName username profileImage profileSlug slug')
        .lean(),
      Profile.find({ userId: { $in: objectIds } })
        .select('userId bio designation institution')
        .lean(),
      Presence.find({ userId: { $in: objectIds } })
        .select('userId status')
        .lean()
    ]);

    const userMap = new Map();
    users.forEach(u => userMap.set(u._id.toString(), u));
    const profileMap = new Map();
    profiles.forEach(p => profileMap.set(p.userId.toString(), p));
    const presenceMap = new Map();
    presences.forEach(pr => presenceMap.set(pr.userId.toString(), pr.status === 'online'));

    // Enrichment helper
    const enrich = (idStr) => {
      const u = userMap.get(idStr);
      if (!u) return null;
      const p = profileMap.get(idStr) || {};
      return {
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        profileImage: u.profileImage?.url || u.profileImage || '',
        profileSlug: u.profileSlug || u.slug,
        bio: p.bio || '',
        designation: p.designation || '',
        institution: p.institution || '',
        isOnline: presenceMap.get(idStr) || false,
        existingConversationId: convMap.get(idStr) || null
      };
    };

    return {
      connections: connectionIds.map(enrich).filter(Boolean),
      followers: followerIds.map(enrich).filter(Boolean),
      following: followingIds.map(enrich).filter(Boolean)
    };
  }

  /**
   * Get pending received connection requests (for the messaging Requests tab)
   */
  async getConnectionRequests(userId) {
    const castUserId = new mongoose.Types.ObjectId(userId);
    return await ConnectionRequest.aggregate([
      { $match: { receiverId: castUserId, status: 'pending' } },
      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'profiles',
          localField: 'senderId',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          note: 1,
          status: 1,
          createdAt: 1,
          user: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            username: 1,
            profileImage: '$user.profileImage.url',
            profileSlug: 1
          },
          profile: {
            bio: 1,
            designation: 1,
            institution: 1,
            skills: 1,
            metrics: 1
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
  }

  /**
   * Mute a conversation
   */
  async muteConversation(userId, conversationId) {
    await Conversation.findByIdAndUpdate(conversationId, {
      $addToSet: { isMuted: userId }
    });
    return { success: true };
  }

  /**
   * Unmute a conversation
   */
  async unmuteConversation(userId, conversationId) {
    await Conversation.findByIdAndUpdate(conversationId, {
      $pull: { isMuted: userId }
    });
    return { success: true };
  }

  /**
   * Delete a conversation (soft-delete for user by hiding all messages in it)
   */
  async deleteConversation(userId, conversationId) {
    const conv = await Conversation.findById(conversationId);
    if (!conv) {
      throw new ValidationError('Conversation not found.');
    }
    if (!conv.participants.map(p => p.toString()).includes(userId.toString())) {
      throw new UnauthorizedError('Unauthorized access.');
    }

    // Hide all messages in this conversation for this user
    await Message.updateMany(
      { conversationId },
      { $addToSet: { deletedBy: userId } }
    );

    return { success: true };
  }

  /**
   * Get single conversation details
   */
  async getConversationById(userId, conversationId) {
    const conv = await Conversation.findById(conversationId)
      .populate('participants', 'firstName lastName profileImage username profileSlug slug email createdAt')
      .lean();

    if (!conv) {
      throw new ValidationError('Conversation not found.');
    }

    const userIdStr = userId.toString();
    if (!conv.participants.map(p => p._id.toString()).includes(userIdStr)) {
      throw new UnauthorizedError('Unauthorized access to this conversation.');
    }

    const otherParticipant = conv.participants.find(
      p => p._id.toString() !== userIdStr
    );

    let detailedParticipant = null;
    if (otherParticipant) {
      const profile = await Profile.findOne({ userId: otherParticipant._id }).lean();
      const presence = await Presence.findOne({ userId: otherParticipant._id }).lean();
      detailedParticipant = {
        ...otherParticipant,
        profileImage: otherParticipant.profileImage?.url || otherParticipant.profileImage || '',
        isOnline: presence ? presence.status === 'online' : false,
        lastSeen: presence?.lastSeen || null,
        bio: profile?.bio || '',
        institution: profile?.institution || '',
        department: profile?.department || '',
        designation: profile?.designation || '',
        skills: profile?.skills || [],
        metrics: profile?.metrics || { totalCitations: 0, researchScore: 0 }
      };
    }

    const isPinned = Array.isArray(conv.isPinned) && conv.isPinned.map(id => id.toString()).includes(userIdStr);
    const isArchived = Array.isArray(conv.isArchived) && conv.isArchived.map(id => id.toString()).includes(userIdStr);
    const isMuted = Array.isArray(conv.isMuted) && conv.isMuted.map(id => id.toString()).includes(userIdStr);

    return {
      ...conv,
      otherParticipant: detailedParticipant,
      isPinned,
      isArchived,
      isMuted
    };
  }
}

module.exports = new MessageService();
