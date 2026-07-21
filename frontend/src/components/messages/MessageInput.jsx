import { useState, useRef, useEffect } from 'react';
import { Paperclip, PlusCircle, Smile, Send, X, Image } from 'lucide-react';
import { SiGoogledrive } from 'react-icons/si';
import { useMessaging } from '../../context/MessagingContext';
import { messagingApi } from '../../services/messagingApi';
import { toast } from '../ui/Toaster';

export default function MessageInput() {
  const { activeConversationId, sendMessage, setUserTyping, getOtherParticipant, blockedUsers, toggleBlockUser } = useMessaging();
  const [inputVal, setInputVal] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);

  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);

  const handleInputChange = (e) => {
    setInputVal(e.target.value);
    if (activeConversationId) {
      setUserTyping(activeConversationId, 'user-me', true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setUserTyping(activeConversationId, 'user-me', false);
      }, 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (activeConversationId) setUserTyping(activeConversationId, 'user-me', false);
    };
  }, [activeConversationId, setUserTyping]);

  const handleSend = () => {
    const trimmed = inputVal.trim();
    if (!trimmed && attachments.length === 0) return;
    if (isUploading) { toast.error('Please wait for uploads to finish'); return; }
    sendMessage(activeConversationId, trimmed, attachments);
    setInputVal('');
    setAttachments([]);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    setUserTyping(activeConversationId, 'user-me', false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = null;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const att = await messagingApi.uploadFile(file, (p) => setUploadProgress(p));
      setAttachments(prev => [...prev, att]);
    } catch {
      toast.error(`Failed to upload ${file.name}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeAttachment = (id) => setAttachments(prev => prev.filter(a => a.id !== id));

  const canSend = (inputVal.trim() || attachments.length > 0) && !isUploading;

  const otherParticipant = getOtherParticipant(activeConversationId);
  const isBlocked = otherParticipant ? blockedUsers.has(otherParticipant.id) : false;

  if (isBlocked) {
    return (
      <footer className="anim-footer bg-[#F8FAFC] border-t border-[#E2E8F0] px-4 py-6 flex-shrink-0 flex flex-col items-center justify-center gap-2">
        <p className="text-sm font-medium text-[#64748B]">You have blocked this user.</p>
        <button 
          onClick={() => toggleBlockUser(otherParticipant.id)} 
          className="text-xs font-semibold text-[#2563EB] hover:text-[#4F46E5] hover:underline"
        >
          Unblock to send a message
        </button>
      </footer>
    );
  }

  return (
    <footer className="anim-footer bg-white border-t border-[#E2E8F0] px-4 pt-3 pb-4 flex-shrink-0 flex flex-col gap-2">
      {/* Upload Progress */}
      {isUploading && (
        <div className="h-1 bg-[#E2E8F0] rounded-full overflow-hidden mx-1">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${uploadProgress}%`,
              background: 'linear-gradient(90deg, #2563EB, #4F46E5)',
            }}
          />
        </div>
      )}

      {/* Attachment Chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {attachments.map((att, idx) => (
            <div
              key={att.id}
              className="anim-chip-scale flex items-center gap-1.5 bg-[#EEF2FF] border border-[#C7D2FE] px-3 py-1.5 rounded-full text-xs font-semibold text-[#4F46E5]"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <span className="truncate max-w-[150px]">{att.fileName}</span>
              <button
                onClick={() => removeAttachment(att.id)}
                className="p-0.5 hover:bg-[#C7D2FE] rounded-full transition-colors text-[#6366F1] hover:text-[#0F172A]"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Row */}
      <div
        className={`input-focus-glow flex items-center gap-2 px-3 py-2.5 bg-[#F8FAFC] rounded-2xl border-2 transition-all duration-300
          ${isFocused ? 'border-[#2563EB] bg-white' : 'border-[#E2E8F0]'}`}
      >
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

        {/* Attachment */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="btn-icon-ripple w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#EEF2FF] transition-colors flex-shrink-0"
          aria-label="Attach file"
        >
          <Paperclip size={17} />
        </button>

        {/* Plus */}
        <div className="relative">
          <button
            onClick={() => setShowPlusMenu(!showPlusMenu)}
            className="btn-icon-ripple w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#EEF2FF] transition-colors flex-shrink-0"
            aria-label="Add attachment"
          >
            <PlusCircle size={17} />
          </button>
          
          {showPlusMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] overflow-hidden z-50">
              <button 
                onClick={() => { fileInputRef.current?.click(); setShowPlusMenu(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors border-b border-[#F1F5F9]"
              >
                <Image size={18} className="text-[#2563EB]" />
                Photo & Video
              </button>
              <button 
                onClick={() => { 
                  window.open('https://drive.google.com', '_blank');
                  toast.success("Opening Google Drive..."); 
                  setShowPlusMenu(false); 
                }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
              >
                <SiGoogledrive size={18} className="text-[#16A34A]" />
                Google Drive
              </button>
            </div>
          )}
        </div>

        {/* Text Input */}
        <input
          value={inputVal}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="flex-1 bg-transparent border-none outline-none text-sm text-[#0F172A] placeholder-[#CBD5E1] py-1"
          placeholder="Type a message or share a link…"
          type="text"
          disabled={isUploading}
        />

        {/* Emoji */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiMenu(!showEmojiMenu)}
            className="btn-icon-ripple w-8 h-8 rounded-full flex items-center justify-center text-[#94A3B8] hover:text-[#F59E0B] hover:bg-[#FEF3C7] transition-colors flex-shrink-0"
            aria-label="Add emoji"
          >
            <Smile size={17} />
          </button>

          {showEmojiMenu && (
            <div className="absolute bottom-full right-0 mb-2 p-3 w-48 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-[#E2E8F0] grid grid-cols-4 gap-2 z-50">
              {['😀', '😂', '❤️', '👍', '🙌', '🔥', '🎉', '💡'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => { setInputVal(prev => prev + emoji); setShowEmojiMenu(false); }}
                  className="w-9 h-9 flex items-center justify-center hover:bg-[#F8FAFC] rounded-lg text-xl transition-colors cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`send-btn w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0
            ${canSend ? 'send-btn-active' : 'cursor-not-allowed'}`}
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </div>
    </footer>
  );
}
