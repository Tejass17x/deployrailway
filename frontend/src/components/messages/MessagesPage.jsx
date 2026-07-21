import { useMessaging } from '../../context/MessagingContext';
import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ConversationsList from './ConversationsList';
import ChatWindow from './ChatWindow';
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import ResearcherInfoPanel from './ResearcherInfoPanel';
import { Toaster } from '../ui/Toaster';

function MessagesLayout() {
  const { activeConversationId, createConversation } = useMessaging();
  const [searchParams, setSearchParams] = useSearchParams();
  const handledParticipantRef = useRef(null);
  const [convsListWidth, setConvsListWidth] = useState(320);
  const [profilePanelWidth, setProfilePanelWidth] = useState(288);
  const [isResizingConvs, setIsResizingConvs] = useState(false);
  const [isResizingProfile, setIsResizingProfile] = useState(false);
  const convsResizeRef = useRef(null);
  const profileResizeRef = useRef(null);

  useEffect(() => {
    const participantId = searchParams.get('participantId');
    if (!participantId || handledParticipantRef.current === participantId) return;

    handledParticipantRef.current = participantId;
    createConversation(participantId)
      .then(() => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('participantId');
        setSearchParams(nextParams, { replace: true });
      })
      .catch(() => {
        handledParticipantRef.current = null;
      });
  }, [createConversation, searchParams, setSearchParams]);

  const handleConvsMouseDown = (e) => {
    setIsResizingConvs(true);
    e.preventDefault();
  };

  const handleProfileMouseDown = (e) => {
    setIsResizingProfile(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingProfile) {
        const containerRect = profileResizeRef.current?.parentElement?.getBoundingClientRect();
        if (containerRect) {
          const newWidth = containerRect.right - e.clientX;
          setProfilePanelWidth(Math.max(200, Math.min(500, newWidth)));
        }
      }
      if (isResizingConvs) {
        const containerRect = convsResizeRef.current?.parentElement?.getBoundingClientRect();
        if (containerRect) {
          const newWidth = e.clientX - containerRect.left;
          setConvsListWidth(Math.max(220, Math.min(480, newWidth)));
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingProfile(false);
      setIsResizingConvs(false);
    };

    if (isResizingProfile || isResizingConvs) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingProfile, isResizingConvs]);

  return (
    <div className="h-[calc(100vh-8rem)] w-full flex overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm relative">
      <Toaster />

      {/* Conversations List — resizable */}
      <div
        className={`flex-shrink-0 h-full bg-white border-r border-[#E8EDF5] transition-colors duration-300 ${activeConversationId ? 'hidden md:flex flex-col' : 'flex flex-col'}`}
        style={{ width: `${convsListWidth}px` }}
      >
        <ConversationsList />
      </div>

      {/* Conversations resize handle */}
      <div
        ref={convsResizeRef}
        className="hidden md:flex w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize transition-colors flex-shrink-0 z-10 items-center justify-center group"
        onMouseDown={handleConvsMouseDown}
        title="Drag to resize"
      >
        <div className="w-0.5 h-8 bg-slate-400 rounded-full group-hover:bg-blue-600 transition-colors opacity-0 group-hover:opacity-100" />
      </div>

      {/* Main Chat Area */}
      <main className={`flex-1 flex flex-col bg-[#F8FAFC] overflow-hidden min-w-0 ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        <ChatHeader />
        <ChatWindow />
        <MessageInput />
      </main>

      {/* Profile panel resize handle — xl screens only */}
      <div
        ref={profileResizeRef}
        className="hidden xl:flex w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize transition-colors flex-shrink-0 z-10 items-center justify-center group"
        onMouseDown={handleProfileMouseDown}
        title="Drag to resize"
      >
        <div className="w-0.5 h-8 bg-slate-400 rounded-full group-hover:bg-blue-600 transition-colors opacity-0 group-hover:opacity-100" />
      </div>

      {/* Researcher Info Panel — xl screens only */}
      <div
        className="hidden xl:flex flex-shrink-0 border-l border-[#E8EDF5] bg-white h-full overflow-hidden"
        style={{ width: `${profilePanelWidth}px` }}
      >
        <ResearcherInfoPanel />
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <MessagesLayout />
  );
}
