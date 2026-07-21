import React, { useState, useRef, useEffect } from 'react';
import { Send, Pin, Trash, Edit2, Smile, AlertCircle, MessageSquare } from 'lucide-react';
import { useProjectChat } from '../hooks/useProjectChat';
import { useAuth } from '../../../context/AuthContext';
import Avatar from '../../../components/ui/Avatar';

export default function ProjectChat({ projectId, typingUsers, emitTyping, emitStopTyping }) {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const {
    messages = [],
    pinnedMessages = [],
    isLoading,
    sendMessage,
    isSending,
    editMessage,
    deleteMessage,
    reactToMessage,
    togglePinMessage,
  } = useProjectChat(projectId);

  const [text, setText] = useState('');
  const [editingMsg, setEditingMsg] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [showPinned, setShowPinned] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (e.target.value.trim()) {
      emitTyping('chat');
    } else {
      emitStopTyping('chat');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;

    try {
      await sendMessage({ content: text, contentType: 'text' });
      setText('');
      emitStopTyping('chat');
    } catch (err) {
      // Toast handles error
    }
  };

  const handleStartEdit = (msg) => {
    setEditingMsg(msg._id);
    setEditingText(msg.content);
  };

  const handleSaveEdit = async (msgId) => {
    if (!editingText.trim()) return;
    try {
      await editMessage({ messageId: msgId, content: editingText });
      setEditingMsg(null);
    } catch (err) {}
  };

  const emojiList = ['👍', '❤️', '👏', '🔥', '🚀', '👀'];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden h-[calc(100vh-170px)] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-slate-500" />
          <h3 className="font-extrabold text-sm text-slate-800">Team Chatroom</h3>
        </div>

        <button
          onClick={() => setShowPinned(!showPinned)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase transition ${
            showPinned ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Pin size={11} /> {showPinned ? 'Hide Pinned' : `Pinned (${pinnedMessages.length})`}
        </button>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages list */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Scroll view */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <p className="text-xs text-slate-400 font-semibold italic text-center py-6">Loading messages...</p>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={36} className="mx-auto text-slate-200 mb-2" />
                <p className="text-xs text-slate-400 font-semibold">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id;
                const isEditing = editingMsg === msg._id;

                return (
                  <div key={msg._id} className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <Avatar
                      src={msg.senderId?.profileImage}
                      name={msg.senderId?.fullName}
                      size="sm"
                      showBorder
                    />

                    {/* Message Bubble Container */}
                    <div className={`max-w-[70%] space-y-1 ${isMe ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-700">{msg.senderId?.fullName}</span>
                        <span className="text-[9px] text-slate-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Bubble */}
                      <div className={`rounded-2xl p-3 border text-xs text-left leading-relaxed relative group ${
                        isMe ? 'bg-blue-650 border-blue-650 text-white' : 'bg-slate-50 border-slate-150 text-slate-800'
                      }`}>
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => setEditingMsg(null)} className="text-[10px] font-bold text-slate-400">Cancel</button>
                              <button onClick={() => handleSaveEdit(msg._id)} className="text-[10px] font-black text-blue-600">Save</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {msg.content}
                            {msg.isEdited && <span className="text-[8px] text-slate-400 ml-1.5">(edited)</span>}
                          </div>
                        )}

                        {/* Inline Actions (edit, pin, delete) */}
                        {!isEditing && (
                          <div className={`absolute -top-6 bg-white border border-slate-100 rounded-lg p-0.5 shadow-sm gap-1 hidden group-hover:flex z-10 ${
                            isMe ? 'right-0' : 'left-0'
                          }`}>
                            <button
                              onClick={() => togglePinMessage(msg._id)}
                              className="p-1 hover:bg-slate-50 text-slate-400 hover:text-amber-500 rounded"
                            >
                              <Pin size={11} />
                            </button>
                            {isMe && (
                              <>
                                <button
                                  onClick={() => handleStartEdit(msg)}
                                  className="p-1 hover:bg-slate-50 text-slate-400 hover:text-blue-500 rounded"
                                >
                                  <Edit2 size={11} />
                                </button>
                                <button
                                  onClick={() => deleteMessage(msg._id)}
                                  className="p-1 hover:bg-slate-50 text-slate-400 hover:text-red-500 rounded"
                                >
                                  <Trash size={11} />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Reactions Row */}
                      {msg.reactions?.length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                          {msg.reactions.map((r, rIdx) => (
                            <button
                              key={rIdx}
                              onClick={() => reactToMessage({ messageId: msg._id, emoji: r.emoji })}
                              className="bg-slate-50 border border-slate-150 rounded-full px-1.5 py-0.5 text-[10px] font-bold flex items-center gap-1 hover:bg-slate-100"
                            >
                              <span>{r.emoji}</span>
                              <span className="text-[9px] text-slate-400">{r.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Socket typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold italic bg-slate-50/50 rounded-xl px-3 py-1.5 w-max">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-slate-500"></span>
                </span>
                <span>{typingUsers.map(u => u.fullName || u.username).join(', ')} typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat input bar */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-150 flex gap-2 items-center shrink-0">
            <input
              value={text}
              onChange={handleInputChange}
              placeholder="Send a message to the research team..."
              className="flex-1 bg-slate-50 rounded-xl border border-slate-150 px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-blue-500 transition"
            />
            <button
              type="submit"
              disabled={!text.trim() || isSending}
              className="bg-blue-650 text-white rounded-xl p-2.5 shadow-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Send size={15} />
            </button>
          </form>
        </div>

        {/* Pinned Messages Panel */}
        {showPinned && (
          <aside className="w-80 border-l border-slate-200 bg-slate-50/50 p-4 space-y-4 overflow-y-auto shrink-0 hidden lg:block">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Pinned Threads</h4>
            </div>

            {pinnedMessages.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-semibold italic text-center py-4">No pinned messages yet.</p>
            ) : (
              pinnedMessages.map((msg) => (
                <div key={msg._id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-1 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-700">{msg.senderId?.fullName}</span>
                    <button
                      onClick={() => togglePinMessage(msg._id)}
                      className="text-slate-400 hover:text-red-500 rounded p-0.5"
                    >
                      <Pin size={10} />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal line-clamp-3">{msg.content}</p>
                </div>
              ))
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
