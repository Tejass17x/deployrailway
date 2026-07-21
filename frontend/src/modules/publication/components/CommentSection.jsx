import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare, ThumbsUp, Reply, Trash2, Edit2, Check, X,
  Loader2, Send, User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import publicationService from '../../../services/publication.service';
import { useSelector } from 'react-redux';
import UserAvatar from '../../../components/ui/Avatar';

const formatTimeAgo = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
};

const Avatar = ({ name, src }) => (
  <UserAvatar
    src={src}
    name={name}
    size="sm"
    showBorder
  />
);

const CommentInput = ({ onSubmit, placeholder = 'Write a comment…', loading, autoFocus = false }) => {
  const [text, setText] = useState('');
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
  };
  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={2}
        className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition-all text-slate-700 placeholder:text-slate-400"
        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(e); }}
      />
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-2 rounded-xl transition-all h-9"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
      </button>
    </form>
  );
};

const SingleComment = ({ comment, publicationId, currentUserId, depth = 0 }) => {
  const queryClient = useQueryClient();
  const [showReply, setShowReply] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const isOwner = currentUserId && String(comment.userId?._id || comment.userId) === String(currentUserId);

  const addMutation = useMutation({
    mutationFn: ({ content, parentId }) => publicationService.addComment(publicationId, content, parentId),
    onSuccess: () => { queryClient.invalidateQueries(['comments', publicationId]); setShowReply(false); },
    onError: () => toast.error('Could not post reply.'),
  });

  const editMutation = useMutation({
    mutationFn: ({ content }) => publicationService.editComment(comment._id, content),
    onSuccess: () => { queryClient.invalidateQueries(['comments', publicationId]); setEditing(false); },
    onError: () => toast.error('Could not edit comment.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => publicationService.deleteComment(comment._id),
    onSuccess: () => { queryClient.invalidateQueries(['comments', publicationId]); toast.success('Deleted.'); },
    onError: () => toast.error('Could not delete.'),
  });

  const likeMutation = useMutation({
    mutationFn: () => publicationService.toggleLikeComment(comment._id),
    onSuccess: () => queryClient.invalidateQueries(['comments', publicationId]),
  });

  const displayName = comment.userId?.fullName || comment.userId?.username || 'Researcher';
  const liked = comment.likedBy?.includes?.(currentUserId);

  return (
    <div className={`flex gap-2.5 ${depth > 0 ? 'ml-8 border-l-2 border-slate-100 pl-3' : ''}`}>
      <Avatar name={displayName} src={comment.userId?.profileImage} />
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">{displayName}</span>
          <span className="text-[10px] text-slate-400">{formatTimeAgo(comment.createdAt)}</span>
          {comment.isEdited && <span className="text-[9px] text-slate-300 italic">edited</span>}
        </div>

        {editing ? (
          <div className="space-y-1.5">
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              autoFocus
              rows={2}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 text-slate-700"
            />
            <div className="flex gap-1.5">
              <button
                onClick={() => editMutation.mutate({ content: editText })}
                disabled={editMutation.isPending || !editText.trim()}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-2.5 py-1 rounded-lg"
              >
                <Check className="w-3 h-3" /> Save
              </button>
              <button
                onClick={() => { setEditing(false); setEditText(comment.content); }}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-700 leading-relaxed">{comment.content}</p>
        )}

        {/* Action Row */}
        {!editing && (
          <div className="flex items-center gap-3 pt-0.5">
            <button
              onClick={() => likeMutation.mutate()}
              className={`inline-flex items-center gap-1 text-[10px] font-bold transition-colors ${liked ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ThumbsUp className="w-3 h-3" />
              {comment.likes || 0}
            </button>
            {depth === 0 && (
              <button
                onClick={() => setShowReply(v => !v)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors"
              >
                <Reply className="w-3 h-3" />
                Reply
              </button>
            )}
            {isOwner && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-amber-600 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Reply Input */}
        {showReply && (
          <div className="mt-2">
            <CommentInput
              autoFocus
              placeholder="Write a reply…"
              loading={addMutation.isPending}
              onSubmit={(content) => addMutation.mutate({ content, parentId: comment._id })}
            />
          </div>
        )}

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-4">
            {comment.replies.map(reply => (
              <SingleComment
                key={reply._id}
                comment={reply}
                publicationId={publicationId}
                currentUserId={currentUserId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CommentSection = ({ publicationId }) => {
  const queryClient = useQueryClient();
  const currentUser = useSelector(s => s.auth?.user);
  const currentUserId = currentUser?._id || currentUser?.id;

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', publicationId],
    queryFn: async () => {
      const res = await publicationService.getComments(publicationId);
      return res.success ? res.data : [];
    },
    enabled: !!publicationId,
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: ({ content }) => publicationService.addComment(publicationId, content, null),
    onSuccess: () => queryClient.invalidateQueries(['comments', publicationId]),
    onError: () => toast.error('Could not post comment.'),
  });

  const topLevel = comments.filter(c => !c.parentId);
  const total = comments.length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-extrabold text-slate-800">
          Discussion
          {total > 0 && (
            <span className="ml-1.5 text-xs font-bold text-slate-400">({total})</span>
          )}
        </h3>
      </div>

      {/* New Comment Input */}
      {currentUserId ? (
        <div className="flex gap-2.5">
          <Avatar name={currentUser?.fullName || currentUser?.username} src={currentUser?.profileImage} />
          <div className="flex-1">
            <CommentInput
              placeholder="Share your thoughts on this publication…"
              loading={addMutation.isPending}
              onSubmit={(content) => addMutation.mutate({ content })}
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500 text-center py-3 bg-slate-50 rounded-xl border border-slate-100">
          Sign in to join the discussion
        </p>
      )}

      {/* Comment List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        </div>
      ) : topLevel.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-200 mx-auto" />
          <p className="text-xs text-slate-400 font-semibold">No comments yet. Be the first to comment.</p>
        </div>
      ) : (
        <div className="space-y-6 divide-y divide-slate-100">
          {topLevel.map(c => (
            <div key={c._id} className="pt-5 first:pt-0">
              <SingleComment
                comment={c}
                publicationId={publicationId}
                currentUserId={currentUserId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
