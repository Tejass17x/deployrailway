import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Send, Paperclip, Smile, FileText, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import messagesService from '../services/messages.service';
import publicationService from '../../../services/publication.service';

const QUICK_EMOJIS = ['😀', '👍', '❤️', '🔥', '👏', '🙌', '💡', '📝', '🎓', '🔬', '📊', '🎉'];

const MessageInput = ({ conversationId, onSend, replyContext, onClearReply, editContext, onClearEdit, socket }) => {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null); // 'emoji' | 'publications' | null
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const { data: pubsData } = useQuery({
    queryKey: ['myPublicationsForSharing'],
    queryFn: async () => {
      const res = await publicationService.getMyPublications({ limit: 10 });
      return res.data;
    },
    enabled: activeSheet === 'publications'
  });

  const publicationsList = pubsData?.docs || [];

  useEffect(() => {
    setText(editContext ? (editContext.text || '') : '');
  }, [editContext]);

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (socket && conversationId) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('chat:typing', { conversationId });
        socket.emit('typing:start', { conversationId });
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('chat:stopTyping', { conversationId });
        socket.emit('typing:stop', { conversationId });
      }, 2000);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size cannot exceed 100MB.');
      return;
    }
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await messagesService.uploadAttachment(formData);
      if (res.success) {
        setAttachedFile(res.data);
        toast.success(`Attached: ${file.name}`);
      } else {
        toast.error('File upload failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload error');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSend = () => {
    if (!text.trim() && !attachedFile) return;
    if (editContext) {
      onSend({ action: 'edit', messageId: editContext._id, text: text.trim() });
    } else {
      onSend({
        action: 'send',
        text: text.trim(),
        attachmentId: attachedFile?._id,
        replyTo: replyContext?._id,
        type: attachedFile ? (attachedFile.fileType.startsWith('image/') ? 'image' : 'pdf') : 'text'
      });
    }
    setText('');
    setAttachedFile(null);
    setActiveSheet(null);
    if (isTyping && socket && conversationId) {
      setIsTyping(false);
      socket.emit('chat:stopTyping', { conversationId });
      socket.emit('typing:stop', { conversationId });
    }
    // Clicking the Send button moves focus to it — bring it back to the textarea
    // so the user can keep typing the next message without clicking in again.
    textareaRef.current?.focus();
  };

  const handleSharePublication = (pub) => {
    const meta = { title: pub.title, slug: pub.slug, authors: pub.authors ? pub.authors.join(', ') : '', journal: pub.journal || '' };
    onSend({ action: 'send', text: JSON.stringify(meta), type: 'publication' });
    setActiveSheet(null);
  };

  const addEmoji = (emoji) => setText(prev => prev + emoji);

  return (
    <div className="bg-white border-t border-slate-100 relative z-20 shrink-0">
      {/* Context bars */}
      <div className="px-4 pt-3 space-y-1.5">
        {replyContext && (
          <div className="flex justify-between items-center bg-slate-50 border border-slate-150 px-3.5 py-2 rounded-2xl animate-in fade-in slide-in-from-bottom-1 duration-150">
            <span className="text-[11px] font-semibold text-slate-500 truncate">
              Replying to: <span className="italic text-slate-700">{replyContext.text}</span>
            </span>
            <button onClick={onClearReply} className="p-0.5 hover:bg-slate-200 rounded-full cursor-pointer shrink-0 ml-2"><X className="w-3.5 h-3.5 text-slate-550" /></button>
          </div>
        )}
        {editContext && (
          <div className="flex justify-between items-center bg-amber-50 border border-amber-150 px-3.5 py-2 rounded-2xl animate-in fade-in slide-in-from-bottom-1 duration-150">
            <span className="text-[11px] font-bold text-amber-700">Editing message</span>
            <button onClick={onClearEdit} className="p-0.5 hover:bg-amber-100 rounded-full cursor-pointer"><X className="w-3.5 h-3.5 text-amber-750" /></button>
          </div>
        )}
        {attachedFile && (
          <div className="flex justify-between items-center bg-emerald-50 border border-emerald-150 px-3.5 py-2 rounded-2xl animate-in fade-in slide-in-from-bottom-1 duration-150">
            <span className="text-[11px] font-bold text-emerald-800 truncate max-w-[250px]">📎 {attachedFile.filename}</span>
            <button onClick={() => setAttachedFile(null)} className="p-0.5 hover:bg-emerald-100 rounded-full cursor-pointer"><X className="w-3.5 h-3.5 text-emerald-700" /></button>
          </div>
        )}
      </div>

      {/* Composer bar */}
      <div className="flex items-end gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2.5 sm:py-3">
        <button onClick={() => setActiveSheet(activeSheet === 'emoji' ? null : 'emoji')} className={`p-2.5 rounded-full transition-all cursor-pointer shrink-0 active:scale-90 ${activeSheet === 'emoji' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}>
          <Smile className="w-5 h-5" />
        </button>

        <label className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full transition-colors cursor-pointer shrink-0 relative active:scale-90">
          <Paperclip className="w-5 h-5" />
          <input type="file" onChange={handleFileChange} className="hidden" disabled={uploadingFile || !!editContext} />
          {uploadingFile && <span className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-full"><span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></span>}
        </label>

        {!editContext && (
          <button onClick={() => setActiveSheet(activeSheet === 'publications' ? null : 'publications')} className={`p-2.5 rounded-full transition-all cursor-pointer shrink-0 hidden sm:block active:scale-90 ${activeSheet === 'publications' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`} title="Share a publication">
            <FileText className="w-5 h-5" />
          </button>
        )}

        <div className="flex-1 flex items-center bg-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/40 rounded-3xl px-4 py-2 sm:py-2.5 transition-all min-w-0 max-h-[120px] overflow-hidden">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInputChange}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={editContext ? "Edit message..." : "Message..."}
            rows={1}
            className="w-full bg-transparent border-none outline-none text-[13px] font-medium text-slate-800 placeholder-slate-400 resize-none max-h-[120px] overflow-y-auto"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!text.trim() && !attachedFile}
          className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-600 hover:bg-blue-700 active:scale-90 disabled:opacity-30 disabled:scale-100 transition-all text-white rounded-full flex items-center justify-center shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5 ml-0.5" />
        </button>
      </div>

      {/* Unified bottom sheet for emoji / publications */}
      {activeSheet && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center sm:justify-center" onClick={() => setActiveSheet(null)}>
          <div className="absolute inset-0 bg-black/30 animate-in fade-in duration-150" />
          <div onClick={(e) => e.stopPropagation()} className="relative w-full sm:w-96 max-h-[70vh] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto my-2.5 shrink-0" />
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <h6 className="text-sm font-extrabold text-slate-800">
                {activeSheet === 'emoji' ? 'Emoji' : 'Share a publication'}
              </h6>
              <button onClick={() => setActiveSheet(null)} className="p-1 hover:bg-slate-100 rounded-full cursor-pointer"><X className="w-4 h-4 text-slate-500" /></button>
            </div>

            <div className="overflow-y-auto p-4">
              {activeSheet === 'emoji' && (
                <div className="grid grid-cols-6 gap-2">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button key={emoji} onClick={() => { addEmoji(emoji); setActiveSheet(null); }} className="text-2xl p-2 hover:bg-slate-50 hover:scale-110 rounded-xl transition-all cursor-pointer">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {activeSheet === 'publications' && (
                <div className="space-y-2">
                  {publicationsList.length > 0 ? publicationsList.map((pub) => (
                    <div key={pub._id} onClick={() => handleSharePublication(pub)} className="p-3 hover:bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer transition-colors space-y-0.5">
                      <p className="text-[13px] font-bold text-slate-800 line-clamp-1">{pub.title}</p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase truncate">{pub.authors ? pub.authors.join(', ') : 'Me'}</p>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 font-semibold py-8 text-center">No publications found to share</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;