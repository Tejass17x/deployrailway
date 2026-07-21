import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, ScreenShare, Sparkles, SwitchCamera, Maximize, Signal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserAvatar from '../../../components/ui/Avatar';
import { useCall } from '../../../context/CallContext';

const CallOverlay = () => {
  const {
    callState,
    localStream,
    remoteStream,
    micActive,
    videoActive,
    screenSharing,
    networkQuality,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleVideo,
    toggleScreenShare,
    switchCamera,
    enableBlurBackground
  } = useCall();

  const { status, type, callerName, callerImage, duration, remoteMediaState } = callState;

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Bind local media stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream && videoActive) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, videoActive]);

  // Bind remote media stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (status === 'idle') return null;

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getNetworkColor = () => {
    if (networkQuality === 'excellent') return 'text-emerald-400';
    if (networkQuality === 'good') return 'text-amber-400';
    return 'text-rose-500 animate-pulse';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-6 text-white select-none"
      >
        {/* Top bar header */}
        <div className="w-full flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/5 text-xs font-bold uppercase tracking-wider">
            <Signal className={`w-4 h-4 ${getNetworkColor()}`} />
            <span>Connection Quality: {networkQuality}</span>
          </div>
          {status === 'active' && (
            <div className="text-sm font-black text-slate-200 bg-white/10 px-4 py-2 rounded-full border border-white/5 tabular-nums">
              {formatDuration(duration)}
            </div>
          )}
        </div>

        {/* Call content region */}
        <div className="flex-1 w-full max-w-6xl flex items-center justify-center py-6 relative">
          {status === 'active' && type === 'video' ? (
            <div className="w-full h-full min-h-[400px] relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl">
              {/* Remote stream full-screen video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Floating PIP local stream video */}
              {videoActive && localStream && (
                <motion.div
                  drag
                  dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }}
                  className="absolute top-4 right-4 w-40 h-28 sm:w-48 sm:h-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-950 z-10 cursor-grab active:cursor-grabbing"
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                </motion.div>
              )}

              {/* Remote Participant Media State Indicators */}
              <div className="absolute bottom-4 left-4 flex flex-col gap-2 bg-slate-900/60 p-3 rounded-2xl border border-white/5 backdrop-blur-md">
                <span className="text-xs font-extrabold">{callerName}</span>
                <div className="flex gap-2 text-slate-350">
                  {!remoteMediaState.micActive && <MicOff className="w-4 h-4 text-rose-500" />}
                  {!remoteMediaState.videoActive && <VideoOff className="w-4 h-4 text-rose-500" />}
                  {remoteMediaState.screenSharing && <ScreenShare className="w-4 h-4 text-emerald-400" />}
                </div>
              </div>
            </div>
          ) : (
            // Audio call view OR dialing/incoming Call View
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-white/10 flex items-center justify-center overflow-hidden shadow-2xl bg-slate-800">
                <UserAvatar
                  src={callerImage}
                  name={callerName}
                  size="3xl"
                  shape="rounded-full"
                  className="w-full h-full"
                />
                {(status === 'dialing' || status === 'incoming') && (
                  <span className="absolute inset-0 rounded-full border-4 border-blue-500 animate-ping opacity-60" />
                )}
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black">{callerName || 'Researcher'}</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  {status === 'dialing' && 'Calling...'}
                  {status === 'incoming' && `Incoming ${type} Call`}
                  {status === 'active' && 'Connected'}
                </p>
              </div>

              {/* Remote Audio tag for voice-only call */}
              {status === 'active' && type === 'voice' && (
                <audio ref={remoteVideoRef} autoPlay controls className="hidden" />
              )}
            </div>
          )}
        </div>

        {/* Action controls footer */}
        <div className="w-full max-w-lg flex items-center justify-center flex-wrap gap-4 py-4 bg-white/5 border border-white/5 rounded-3xl backdrop-blur-md px-6 shadow-xl mb-4">
          {status === 'incoming' ? (
            <>
              {/* Accept Call */}
              <button
                onClick={acceptCall}
                className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20"
                title="Accept Call"
              >
                <Phone className="w-6 h-6 fill-white" />
              </button>

              {/* Decline Call */}
              <button
                onClick={rejectCall}
                className="w-14 h-14 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-rose-500/20"
                title="Decline Call"
              >
                <PhoneOff className="w-6 h-6 fill-white" />
              </button>
            </>
          ) : (
            <>
              {/* Toggle Microphone */}
              <button
                onClick={toggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer border ${micActive ? 'bg-white/10 border-white/10 hover:bg-white/20' : 'bg-rose-500 border-rose-500 hover:bg-rose-600'}`}
                title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              {type === 'video' && (
                <>
                  {/* Toggle Camera */}
                  <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer border ${videoActive ? 'bg-white/10 border-white/10 hover:bg-white/20' : 'bg-slate-700 border-slate-700 hover:bg-slate-650'}`}
                    title={videoActive ? 'Turn Video Off' : 'Turn Video On'}
                  >
                    {videoActive ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>

                  {/* Toggle Screen Sharing */}
                  <button
                    onClick={toggleScreenShare}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer border ${screenSharing ? 'bg-emerald-500 border-emerald-500 hover:bg-emerald-600' : 'bg-white/10 border-white/10 hover:bg-white/20'}`}
                    title={screenSharing ? 'Stop Screen Share' : 'Start Screen Share'}
                  >
                    <ScreenShare className="w-5 h-5" />
                  </button>

                  {/* Switch Camera */}
                  <button
                    onClick={switchCamera}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 bg-white/10 border border-white/10 hover:bg-white/20 cursor-pointer"
                    title="Switch Camera"
                  >
                    <SwitchCamera className="w-5 h-5" />
                  </button>

                  {/* Background Blur */}
                  <button
                    onClick={enableBlurBackground}
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 bg-white/10 border border-white/10 hover:bg-white/20 cursor-pointer"
                    title="Blur Background"
                  >
                    <Sparkles className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* End Call / Cancel */}
              <button
                onClick={endCall}
                className="w-12 h-12 bg-rose-500 hover:bg-rose-600 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-rose-500/20"
                title="End Call"
              >
                <PhoneOff className="w-5 h-5 fill-white" />
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallOverlay;
