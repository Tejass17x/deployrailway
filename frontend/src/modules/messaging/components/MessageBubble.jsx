import React, { useState, memo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCheck, Edit2, Trash2, Reply, Copy, FileText, ExternalLink, MoreHorizontal } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import messagesService from '../services/messages.service';
import Avatar from '../../../components/ui/Avatar';

const EMOJIS = ['👍', '❤️', '👏', '💡', '😮', '❓'];

const MessageBubble = memo(({ message, onReply, onEditInit, otherParticipant, showAvatar, isDifferentSender }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteConfirmType, setDeleteConfirmType] = useState(null); // null | 'everyone' | 'me'

  const { _id, senderId, text, message: textMessage, type, attachment, replyTo, status, edited, deleted, createdAt, reactions = [] } = message;

  // Helper to extract string ID
  const getUserIdStr = (u) => {
    if (!u) return '';
    if (typeof u === 'object') {
      const idVal = u.userId || u._id || u.id;
      return idVal ? idVal.toString() : '';
    }
    return u.toString();
  };

  // Robust Sender Detection (Requirement 1 & Step 6)
  const authenticatedUserId = getUserIdStr(user);
  const msgSenderId = getUserIdStr(senderId || message.sender);
  const isSender = authenticatedUserId && msgSenderId && msgSenderId === authenticatedUserId;

  const reactMutation = useMutation({
    mutationFn: async (emoji) => await messagesService.reactToMessage(_id, emoji),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', message.conversationId] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (deleteType) => await messagesService.deleteMessage(_id, deleteType),
    onSuccess: (_, variables) => {
      toast.success(variables === 'everyone' ? 'Message deleted for everyone' : 'Message deleted');
      queryClient.invalidateQueries({ queryKey: ['messages', message.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  const handleCopy = () => {
    const textToCopy = text || textMessage || '';
    navigator.clipboard.writeText(textToCopy);
    toast.success('Text copied to clipboard');
    setSheetOpen(false);
  };

  let parsedMeta = null;
  const actualText = text || textMessage || '';
  if (actualText && (type === 'publication' || type === 'project' || type === 'dataset')) {
    try { parsedMeta = JSON.parse(actualText); } catch (e) { /* fallback to plain text */ }
  }

  const avatarUrl = otherParticipant?.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150";
  const senderName = otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Researcher';
  const timeString = new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex w-full ${isSender ? 'justify-end' : 'justify-start'} relative group`}
      style={{ marginTop: isDifferentSender ? '14px' : '6px' }}
    >
      <div className={`flex items-end gap-2.5 max-w-[70%] sm:max-w-[60%] ${isSender ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar: Only show on left for incoming messages when sender changes (Requirement 6) */}
        {!isSender && (
          <div className="w-8 h-8 flex-shrink-0 mb-1">
            {showAvatar ? (
              <Avatar
                src={otherParticipant?.profileImage}
                name={senderName}
                size="sm"
              />
            ) : (
              <div className="w-8 h-8" />
            )}
          </div>
        )}

        {/* Message Bubble Column */}
        <div className="flex flex-col relative">
          
          {replyTo && !deleted && (
            <div className={`text-[10px] font-semibold flex items-center gap-1 px-1.5 mb-1 ${isSender ? 'text-slate-400 self-end' : 'text-slate-500 self-start'}`}>
              <Reply className="w-3 h-3" />
              <span className="truncate max-w-[200px]">{replyTo.deleted ? 'Deleted message' : replyTo.text || replyTo.message}</span>
            </div>
          )}

          <div className="flex items-end gap-1.5">
            {isSender && (
              <button onClick={() => setSheetOpen(true)} className="p-1 text-slate-400 hover:text-slate-650 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0 order-1 mb-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            )}

            {/* Bubble itself (Requirement 2, 3, 4, 5, 17) */}
            <div 
              className={`px-4 py-3 rounded-[18px] text-[13px] leading-relaxed relative ${
                deleted 
                  ? 'bg-slate-100 text-slate-400 italic rounded-br-[6px] border border-slate-200'
                  : isSender 
                    ? 'bg-[#2563EB] text-white rounded-br-[6px] shadow-sm'
                    : 'bg-[#34D399] text-white rounded-bl-[6px] shadow-sm'
              }`}
              style={{ minWidth: '80px' }}
            >
              {deleted ? (
                <span>{actualText}</span>
              ) : parsedMeta ? (
                <div className="space-y-2 text-left min-w-[180px]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider block text-white/70">📄 Shared {type}</span>
                  <h5 className="font-bold text-[13px] text-white">{parsedMeta.title || parsedMeta.name}</h5>
                  {parsedMeta.authors && <p className="text-[11px] opacity-90 font-medium">{parsedMeta.authors}</p>}
                  {parsedMeta.journal && <p className="text-[10px] opacity-75 font-medium italic">{parsedMeta.journal}</p>}
                  <a href={parsedMeta.url || `/publication/${parsedMeta.slug}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] font-bold pt-1 w-fit text-white hover:underline">
                    <span>View Resource</span><ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <span className="whitespace-pre-wrap break-words">{actualText}</span>
              )}

              {attachment && !deleted && (
                <div className="mt-2.5 pt-2.5 text-left border-t border-white/20">
                  {attachment.fileType?.startsWith('image/') ? (
                    <img src={attachment.url} alt={attachment.filename} className="max-h-56 w-full rounded-xl object-cover cursor-pointer" onClick={() => window.open(attachment.url, '_blank')} />
                  ) : (
                    <a href={attachment.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 p-2 rounded-xl text-[11px] font-bold bg-white/15 hover:bg-white/25 text-white transition-all">
                      <FileText className="w-4 h-4 shrink-0 text-white/80" />
                      <span className="truncate max-w-[150px]">{attachment.filename}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  )}
                </div>
              )}

              {/* Timestamp and ticks (Requirement 2, 3, 9, 17) */}
              <div className={`flex items-center gap-1.5 mt-1.5 text-[10px] text-white/70 ${isSender ? 'justify-end' : 'justify-start'}`}>
                {edited && <span className="opacity-80">edited</span>}
                <span>{timeString}</span>
                {isSender && !deleted && (
                  <span className="shrink-0 ml-0.5">
                    {status === 'seen' || status === 'read' ? (
                      <CheckCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
                    ) : status === 'delivered' ? (
                      <CheckCheck className="w-3.5 h-3.5 text-slate-350" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-slate-350" />
                    )}
                  </span>
                )}
              </div>
            </div>

            {!isSender && (
              <button onClick={() => setSheetOpen(true)} className="p-1 text-slate-400 hover:text-slate-650 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0 mb-1">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>

          {reactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isSender ? 'justify-end' : 'justify-start'}`}>
              {reactions.map((react) => (
                <span key={react._id} className="px-1.5 py-0.5 bg-white border border-slate-200 text-[11px] rounded-full shadow-xs cursor-help" title={`${react.userId?.firstName} reacted with ${react.reaction}`}>
                  {react.reaction}
                </span>
              ))}
            </div>
          )}
        </div>

      </div>

      {sheetOpen && !deleted && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center sm:justify-center" onClick={() => setSheetOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div onClick={(e) => e.stopPropagation()} className="relative w-full sm:w-64 bg-white rounded-t-3xl sm:rounded-2xl p-2 shadow-2xl">
            <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto my-2.5" />
            <div className="flex items-center justify-center gap-2 px-2 py-3 border-b border-slate-100 mb-1">
              {EMOJIS.map(emoji => (
                <button key={emoji} onClick={() => { reactMutation.mutate(emoji); setSheetOpen(false); }} className="text-xl hover:scale-125 transition-transform cursor-pointer">{emoji}</button>
              ))}
            </div>
            <button onClick={() => { onReply(); setSheetOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 cursor-pointer">
              <Reply className="w-4 h-4" /> Reply
            </button>
            <button onClick={handleCopy} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 cursor-pointer">
              <Copy className="w-4 h-4" /> Copy text
            </button>
            {isSender && (
              <button onClick={() => { onEditInit(); setSheetOpen(false); }} className="w-full flex items-center gap-3 px-3 py-3 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-700 cursor-pointer">
                <Edit2 className="w-4 h-4" /> Edit
              </button>
            )}
            <button
              onClick={() => {
                setDeleteConfirmType(isSender ? 'everyone' : 'me');
                setSheetOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-red-50 rounded-xl text-sm font-semibold text-red-500 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> {isSender ? 'Delete for everyone' : 'Delete for me'}
            </button>
            <button onClick={() => setSheetOpen(false)} className="w-full text-center px-3 py-3 mt-1 text-sm font-bold text-slate-400 hover:text-slate-650 cursor-pointer sm:hidden">Cancel</button>
          </div>
        </div>
      )}
      {deleteConfirmType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setDeleteConfirmType(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 text-center">
              {deleteConfirmType === 'everyone' ? 'Delete message for everyone?' : 'Delete message for yourself?'}
            </h4>
            <p className="text-xs text-slate-450 font-medium text-center mt-1.5">
              {deleteConfirmType === 'everyone'
                ? "This message will be removed for everyone in this chat. This can't be undone."
                : "This message will be removed only from your view. This can't be undone."}
            </p>
            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => setDeleteConfirmType(null)}
                className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(deleteConfirmType);
                  setDeleteConfirmType(null);
                }}
                className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 active:scale-[0.98] transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;