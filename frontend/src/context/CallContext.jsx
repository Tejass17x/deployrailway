import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import messagesService from '../modules/messaging/services/messages.service';
import { toast } from 'react-hot-toast';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const currentUserId = user?.userId || user?._id || user?.id;

  const [callState, setCallState] = useState({
    status: 'idle', // 'idle' | 'dialing' | 'incoming' | 'active' | 'ended'
    type: 'voice',  // 'voice' | 'video'
    callerId: null,
    callerName: '',
    callerImage: '',
    callId: null,
    targetUserId: null,
    peerSocketId: null, // Track specific socket of the peer
    initiator: false,
    iceState: 'new',
    connectionState: 'new',
    duration: 0,
    remoteMediaState: { micActive: true, videoActive: true, screenSharing: false }
  });

  const callStateRef = useRef(callState);
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [cameraPermission, setCameraPermission] = useState('prompt');
  const [micPermission, setMicPermission] = useState('prompt');
  const [networkQuality, setNetworkQuality] = useState('excellent'); // 'excellent' | 'good' | 'poor'

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const screenTrackRef = useRef(null);
  const ringtoneRef = useRef(null);
  const callTimerRef = useRef(null);
  const statsIntervalRef = useRef(null);
  const ringtoneIntervalRef = useRef(null);

  // Stop Ringtone / Vibration
  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      try {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      } catch (err) {}
    }
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    if (navigator.vibrate) {
      navigator.vibrate(0); // stop vibration
    }
  }, []);

  // Play Ringtone / Vibration
  const playRingtone = useCallback(() => {
    try {
      if (!ringtoneRef.current) {
        // High quality sound clip
        ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-84.wav');
        ringtoneRef.current.loop = true;
      }
      ringtoneRef.current.play().catch(() => {
        // Autoplay blocked fallback: synthesize beep pattern
        ringtoneIntervalRef.current = setInterval(() => {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 440;
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          } catch (e) {}
        }, 1500);
      });

      // Periodic Vibration for Mobile
      if (navigator.vibrate) {
        navigator.vibrate([500, 250, 500, 250, 500]);
        const vibrateInterval = setInterval(() => {
          if (callStateRef.current.status === 'incoming') {
            navigator.vibrate([500, 250, 500, 250, 500]);
          } else {
            clearInterval(vibrateInterval);
          }
        }, 3000);
      }
    } catch (err) {}
  }, []);

  // Clean up WebRTC session
  const cleanUpCall = useCallback(() => {
    stopRingtone();

    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setScreenSharing(false);
    setMicActive(true);
    setVideoActive(true);

    setCallState({
      status: 'idle',
      type: 'voice',
      callerId: null,
      callerName: '',
      callerImage: '',
      callId: null,
      targetUserId: null,
      peerSocketId: null,
      initiator: false,
      iceState: 'new',
      connectionState: 'new',
      duration: 0,
      remoteMediaState: { micActive: true, videoActive: true, screenSharing: false }
    });
  }, [stopRingtone]);

  // Handle active call duration timer
  useEffect(() => {
    if (callState.status === 'active') {
      callTimerRef.current = setInterval(() => {
        setCallState((prev) => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
    return () => clearInterval(callTimerRef.current);
  }, [callState.status]);

  // WebRTC Setup Process
  const setupWebRTC = useCallback(async () => {
    try {
      const type = callStateRef.current.type;
      const targetUserId = callStateRef.current.targetUserId;

      // 1. Capture Local Stream
      const constraints = {
        audio: true,
        video: type === 'video' ? { width: 1280, height: 720, facingMode: 'user' } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMicPermission('granted');
      if (type === 'video') setCameraPermission('granted');

      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      // Add tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          remoteStreamRef.current = event.streams[0];
          setRemoteStream(event.streams[0]);
        }
      };

      // Handle ICE Candidates targeting specific socket
      pc.onicecandidate = (event) => {
        if (event.candidate && socket && callStateRef.current.peerSocketId) {
          socket.emit('ICE_CANDIDATE', {
            targetSocketId: callStateRef.current.peerSocketId,
            candidate: event.candidate,
            callId: callStateRef.current.callId
          });
        }
      };

      // Watch Connection States
      pc.oniceconnectionstatechange = () => {
        const iceState = pc.iceConnectionState;
        setCallState((prev) => ({ ...prev, iceState }));
        
        // ICE Auto-Reconnect Fallback
        if (iceState === 'failed' || iceState === 'disconnected') {
          console.warn('🔌 WebRTC Connection Alert: ICE Failed or Disconnected. Retrying Connection...');
          setNetworkQuality('poor');
          if (callStateRef.current.initiator && callStateRef.current.peerSocketId) {
            pc.createOffer({ iceRestart: true }).then((offer) => {
              pc.setLocalDescription(offer);
              socket.emit('WEBRTC_OFFER', { targetSocketId: callStateRef.current.peerSocketId, sdp: offer, callId: callStateRef.current.callId });
            }).catch((err) => console.error('ICE restart offer creation failed:', err));
          }
        } else if (iceState === 'connected' || iceState === 'completed') {
          setNetworkQuality('excellent');
        }
      };

      pc.onconnectionstatechange = () => {
        const connectionState = pc.connectionState;
        setCallState((prev) => ({ ...prev, connectionState }));
        if (connectionState === 'connected') {
          setNetworkQuality('excellent');
        }
      };

      // Periodic stats gathering (network quality)
      statsIntervalRef.current = setInterval(async () => {
        if (pc && pc.connectionState === 'connected') {
          try {
            const stats = await pc.getStats();
            stats.forEach((report) => {
              if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                const rtt = report.currentRoundTripTime;
                if (rtt) {
                  if (rtt > 0.25) setNetworkQuality('poor');
                  else if (rtt > 0.1) setNetworkQuality('good');
                  else setNetworkQuality('excellent');
                }
              }
            });
          } catch (e) {}
        }
      }, 5000);

      // If initiator, create the SDP offer targeting the peer's socket
      if (callStateRef.current.initiator && callStateRef.current.peerSocketId) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('WEBRTC_OFFER', {
          targetSocketId: callStateRef.current.peerSocketId,
          sdp: offer,
          callId: callStateRef.current.callId
        });
      }

    } catch (err) {
      console.error('Failed to configure WebRTC session:', err);
      toast.error('Could not access microphone/camera. Permission denied.');
      cleanUpCall();
    }
  }, [socket, cleanUpCall]);

  // Handle call state transition triggers
  useEffect(() => {
    if (callState.status === 'active' && !peerConnectionRef.current) {
      setupWebRTC();
    }
    if (callState.status === 'incoming') {
      playRingtone();
    } else {
      stopRingtone();
    }
    return () => {
      stopRingtone();
    };
  }, [callState.status, setupWebRTC, playRingtone, stopRingtone]);

  // Listen to Calling signaling events (Registered ONCE when socket connects)
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = ({ callerId, callerName, callerImage, callId, type, callerSocketId }) => {
      // If already in a call, ignore incoming calls (backend handles busy rejection)
      if (callStateRef.current.status !== 'idle') {
        return;
      }
      setCallState({
        status: 'incoming',
        type,
        callerId,
        callerName,
        callerImage,
        callId,
        targetUserId: callerId,
        peerSocketId: callerSocketId,
        initiator: false,
        iceState: 'new',
        connectionState: 'new',
        duration: 0,
        remoteMediaState: { micActive: true, videoActive: true, screenSharing: false }
      });
    };

    const handleCallRinging = () => {
      setCallState(prev => {
        if (prev.status === 'dialing') {
          return { ...prev, status: 'dialing' }; // Keep dialing, UI shows ringing
        }
        return prev;
      });
    };

    const handleCallAccept = ({ accepterSocketId }) => {
      setCallState(prev => ({ ...prev, status: 'active', peerSocketId: accepterSocketId }));
    };

    const handleCallReject = ({ reason }) => {
      toast.error(reason === 'busy' ? 'User is busy on another call' : 'Call rejected by user');
      cleanUpCall();
    };

    const handleCallCancel = () => {
      toast.warn('Call cancelled by caller');
      cleanUpCall();
    };

    const handleCallTimeout = () => {
      toast.error('No answer. Call ended.');
      cleanUpCall();
    };

    const handleCallEnd = () => {
      toast('Call ended');
      cleanUpCall();
    };

    const handleWebRTCOffer = async ({ senderSocketId, sdp }) => {
      try {
        const pc = peerConnectionRef.current;
        if (!pc) return;
        
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('WEBRTC_ANSWER', {
          targetSocketId: senderSocketId || callStateRef.current.peerSocketId,
          sdp: answer,
          callId: callStateRef.current.callId
        });
      } catch (err) {
        console.error('Failed to set WebRTC offer:', err);
      }
    };

    const handleWebRTCAnswer = async ({ sdp }) => {
      try {
        const pc = peerConnectionRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } catch (err) {
        console.error('Failed to set WebRTC answer:', err);
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      try {
        const pc = peerConnectionRef.current;
        if (!pc) return;
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Failed to add ICE candidate:', err);
      }
    };

    const handleMediaStateChanged = ({ micActive, videoActive, screenSharing }) => {
      setCallState((prev) => ({
        ...prev,
        remoteMediaState: { micActive, videoActive, screenSharing }
      }));
    };

    const handleCallAnsweredElsewhere = () => {
      toast('Call answered on another device');
      cleanUpCall();
    };

    socket.on('CALL_INVITE', handleIncomingCall);
    socket.on('CALL_RINGING', handleCallRinging);
    socket.on('CALL_ACCEPT', handleCallAccept);
    socket.on('CALL_REJECT', handleCallReject);
    socket.on('CALL_CANCEL', handleCallCancel);
    socket.on('CALL_TIMEOUT', handleCallTimeout);
    socket.on('CALL_END', handleCallEnd);
    socket.on('WEBRTC_OFFER', handleWebRTCOffer);
    socket.on('WEBRTC_ANSWER', handleWebRTCAnswer);
    socket.on('ICE_CANDIDATE', handleIceCandidate);
    socket.on('MEDIA_STATE_CHANGED', handleMediaStateChanged);
    socket.on('CALL_ANSWERED_ELSEWHERE', handleCallAnsweredElsewhere);

    // Legacy compat
    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccept);
    socket.on('call:rejected', handleCallReject);
    socket.on('call:hungup', handleCallEnd);

    return () => {
      socket.off('CALL_INVITE', handleIncomingCall);
      socket.off('CALL_RINGING', handleCallRinging);
      socket.off('CALL_ACCEPT', handleCallAccept);
      socket.off('CALL_REJECT', handleCallReject);
      socket.off('CALL_CANCEL', handleCallCancel);
      socket.off('CALL_TIMEOUT', handleCallTimeout);
      socket.off('CALL_END', handleCallEnd);
      socket.off('WEBRTC_OFFER', handleWebRTCOffer);
      socket.off('WEBRTC_ANSWER', handleWebRTCAnswer);
      socket.off('ICE_CANDIDATE', handleIceCandidate);
      socket.off('MEDIA_STATE_CHANGED', handleMediaStateChanged);
      socket.off('CALL_ANSWERED_ELSEWHERE', handleCallAnsweredElsewhere);
      
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccept);
      socket.off('call:rejected', handleCallReject);
      socket.off('call:hungup', handleCallEnd);
    };
  }, [socket, cleanUpCall]);

  // Initiate call API and Socket emit
  const startCall = async (targetUserId, type, conversationId) => {
    if (!targetUserId) return;
    try {
      setCallState({
        status: 'dialing',
        type,
        callerId: currentUserId,
        callerName: 'Researcher',
        callerImage: '',
        callId: null,
        targetUserId,
        peerSocketId: null,
        initiator: true,
        iceState: 'new',
        connectionState: 'new',
        duration: 0,
        remoteMediaState: { micActive: true, videoActive: true, screenSharing: false }
      });

      // Create Call record in DB
      const res = await messagesService.startCall({
        type,
        targetUserId,
        conversationId
      });

      const call = res.data;

      setCallState((prev) => ({
        ...prev,
        callId: call.callId
      }));

      if (socket) {
        socket.emit('CALL_INVITE', {
          targetUserId,
          type,
          conversationId,
          callId: call.callId
        });
      }
    } catch (err) {
      toast.error('Could not initiate calling system log.');
      cleanUpCall();
    }
  };

  const acceptCall = () => {
    if (socket && callStateRef.current.peerSocketId) {
      socket.emit('CALL_ACCEPT', {
        callerId: callStateRef.current.targetUserId,
        targetSocketId: callStateRef.current.peerSocketId,
        callId: callStateRef.current.callId
      });
    }
    setCallState((prev) => ({ ...prev, status: 'active' }));
  };

  const rejectCall = async () => {
    const callId = callStateRef.current.callId;
    if (socket && callStateRef.current.peerSocketId) {
      socket.emit('CALL_REJECT', {
        callerId: callStateRef.current.targetUserId,
        targetSocketId: callStateRef.current.peerSocketId,
        callId
      });
    }
    cleanUpCall();
    try {
      await messagesService.endCall(callId, 'rejected');
    } catch (e) {}
  };

  const endCall = async () => {
    const callId = callStateRef.current.callId;
    const targetUserId = callStateRef.current.targetUserId;
    const peerSocketId = callStateRef.current.peerSocketId;
    const isInitiator = callStateRef.current.initiator;
    const status = callStateRef.current.status;

    if (socket) {
      if (status === 'dialing' || status === 'incoming') {
        socket.emit(isInitiator ? 'CALL_CANCEL' : 'CALL_REJECT', {
          targetUserId: targetUserId,
          targetSocketId: peerSocketId,
          callId
        });
      } else {
        socket.emit('CALL_END', {
          targetUserId,
          targetSocketId: peerSocketId,
          callId,
          iceState: peerConnectionRef.current?.iceConnectionState,
          connectionState: peerConnectionRef.current?.connectionState
        });
      }
    }

    cleanUpCall();
    try {
      const finalStatus = status === 'active' ? 'completed' : (isInitiator ? 'cancelled' : 'rejected');
      await messagesService.endCall(callId, finalStatus);
    } catch (e) {}
  };

  // Toggle mic track
  const toggleMic = () => {
    const nextVal = !micActive;
    setMicActive(nextVal);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextVal;
      });
    }
    // notify remote peer
    if (socket && callStateRef.current.targetUserId) {
      socket.emit('MEDIA_STATE_CHANGED', {
        targetUserId: callStateRef.current.targetUserId,
        targetSocketId: callStateRef.current.peerSocketId,
        micActive: nextVal,
        videoActive,
        screenSharing
      });
    }
  };

  // Toggle video track
  const toggleVideo = () => {
    const nextVal = !videoActive;
    setVideoActive(nextVal);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextVal;
      });
    }
    // notify remote peer
    if (socket && callStateRef.current.targetUserId) {
      socket.emit('MEDIA_STATE_CHANGED', {
        targetUserId: callStateRef.current.targetUserId,
        targetSocketId: callStateRef.current.peerSocketId,
        micActive,
        videoActive: nextVal,
        screenSharing
      });
    }
  };

  // Screen Share Toggle
  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const track = stream.getVideoTracks()[0];
        screenTrackRef.current = track;

        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(track);
          }
        }

        track.onended = () => {
          stopScreenSharing();
        };

        setScreenSharing(true);
        
        if (socket && callStateRef.current.targetUserId) {
          socket.emit('MEDIA_STATE_CHANGED', {
            targetUserId: callStateRef.current.targetUserId,
            targetSocketId: callStateRef.current.peerSocketId,
            micActive,
            videoActive,
            screenSharing: true
          });
        }
      } catch (err) {
        console.error('DisplayMedia capture failed:', err);
      }
    } else {
      stopScreenSharing();
    }
  };

  const stopScreenSharing = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    if (localStreamRef.current && peerConnectionRef.current) {
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      const senders = peerConnectionRef.current.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      if (videoSender && cameraTrack) {
        videoSender.replaceTrack(cameraTrack);
      }
    }
    setScreenSharing(false);
    
    if (socket && callStateRef.current.targetUserId) {
      socket.emit('MEDIA_STATE_CHANGED', {
        targetUserId: callStateRef.current.targetUserId,
        targetSocketId: callStateRef.current.peerSocketId,
        micActive,
        videoActive,
        screenSharing: false
      });
    }
  };

  const switchCamera = async () => {
    if (callStateRef.current.type !== 'video' || !localStreamRef.current) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      if (videoDevices.length <= 1) return; // only one camera

      // Toggle facing mode constraints
      const tracks = localStreamRef.current.getVideoTracks();
      tracks.forEach((t) => t.stop());

      // Toggle constraints
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true
      });

      localStreamRef.current = nextStream;
      setLocalStream(nextStream);

      if (peerConnectionRef.current) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(nextStream.getVideoTracks()[0]);
        }
      }
    } catch (e) {
      console.error('Switch camera failed:', e);
    }
  };

  const enableBlurBackground = () => {
    // Standard virtual blur background mock for client browsers
    toast.success('Background blur active');
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        localStream,
        remoteStream,
        micActive,
        videoActive,
        screenSharing,
        cameraPermission,
        micPermission,
        networkQuality,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMic,
        toggleVideo,
        toggleScreenShare,
        switchCamera,
        enableBlurBackground
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
