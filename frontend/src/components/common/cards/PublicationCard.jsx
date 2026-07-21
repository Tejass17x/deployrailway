import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Bookmark, MessageSquare, Share2, Award, 
  Eye, Download, FileText, ChevronDown, ChevronUp, 
  ExternalLink, Quote, ShieldCheck,
  Send, CornerDownRight, Check
} from 'lucide-react';
import { toggleLikeInFeed, toggleBookmarkInFeed } from '../../../redux/slices/feedSlice';
import { addCommentToStore, setComments, toggleLikeCommentSuccess } from '../../../redux/slices/commentSlice';
import { moveBookmarkInStore } from '../../../redux/slices/bookmarkSlice';
import { toast } from 'react-hot-toast';
import feedService from '@/services/feed.service';
import AiAnalysisModal from '../modals/AiAnalysisModal';
import BookmarkFoldersModal from '../modals/BookmarkFoldersModal';

const PublicationCard = React.forwardRef(({ pub }, ref) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  
  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);
  
  // Comments section state
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Expand abstract
  const [showAbstract, setShowAbstract] = useState(false);

  // Fetch comments when comments section is toggled
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    try {
      const res = await feedService.getComments(pub._id);
      if (res.success) {
        setCommentsList(res.data.docs);
        dispatch(setComments({ publicationId: pub._id, comments: res.data.docs }));
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleLike = async () => {
    try {
      const res = await feedService.toggleLike(pub._id);
      if (res.success) {
        dispatch(toggleLikeInFeed(pub._id));
        toast.success(pub.liked ? 'Removed from liked' : 'Added to liked publications');
      }
    } catch (err) {
      toast.error('Error updating like status');
    }
  };

  const handleSelectBookmarkFolder = async (folderName) => {
    try {
      const res = await feedService.toggleBookmark(pub._id, folderName);
      if (res.success) {
        dispatch(toggleBookmarkInFeed(pub._id));
        dispatch(moveBookmarkInStore({ publicationId: pub._id, folderName }));
        setIsBookmarkModalOpen(false);
        toast.success(`Bookmarked in folder: ${folderName}`);
      }
    } catch (err) {
      toast.error('Error saving bookmark');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const res = await feedService.addComment(pub._id, newCommentText.trim());

      if (res.success) {
        setNewCommentText('');
        toast.success('Comment posted!');
        // Reload comments
        fetchComments();
      }
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  const handlePostReply = async (commentId) => {
    if (!replyText.trim()) return;

    try {
      const res = await feedService.addComment(pub._id, replyText.trim(), commentId);

      if (res.success) {
        setReplyText('');
        setActiveReplyId(null);
        toast.success('Reply posted!');
        fetchComments();
      }
    } catch (err) {
      toast.error('Failed to post reply');
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const res = await feedService.toggleLikeComment(commentId);
      if (res.success) {
        dispatch(toggleLikeCommentSuccess({
          publicationId: pub._id,
          commentId,
          likesCount: res.data.likesCount,
          liked: res.data.liked,
          userId: user?._id
        }));
        fetchComments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const downloadPdf = () => {
    toast.success('PDF Download started successfully!');
    if (pub.pdfURL) {
      window.open(pub.pdfURL, '_blank');
    }
  };

  const handleCite = async () => {
    const citation = `${pub.authors}. "${pub.title}." ${pub.publication || pub.journal} (${pub.year}).`;
    try {
      await navigator.clipboard.writeText(citation);
      toast.success('Citation copied in MLA format!');
    } catch {
      toast.error('Failed to copy citation');
    }
  };

  // Helper function to recursively render comments
  const renderCommentsList = (comments, depth = 0) => {
    return comments.map((comment) => (
      <div 
        key={comment._id} 
        className="space-y-3"
        style={{ marginLeft: depth > 0 ? `${Math.min(depth * 20, 60)}px` : '0px' }}
      >
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex gap-3 text-left">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
            {comment.userId?.firstName ? comment.userId.firstName[0] : 'S'}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                {comment.userId?.fullName || `${comment.userId?.firstName} ${comment.userId?.lastName}`}
              </span>
              <span className="text-[10px] text-slate-400">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {comment.text}
            </p>
            
            {/* Actions for comment */}
            <div className="flex items-center gap-4 pt-1.5 text-[10px] font-bold text-slate-500">
              <button 
                onClick={() => handleLikeComment(comment._id)}
                className={`hover:text-rose-500 flex items-center gap-1 ${
                  comment.likes?.includes(user?._id) ? 'text-rose-500' : ''
                }`}
              >
                <Heart className="w-3.5 h-3.5" />
                <span>{comment.likes?.length || 0} Likes</span>
              </button>
              <button 
                onClick={() => {
                  setActiveReplyId(comment._id);
                  setReplyText('');
                }}
                className="hover:text-indigo-500 flex items-center gap-1"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                <span>Reply</span>
              </button>
            </div>
          </div>
        </div>

        {/* Reply input field */}
        {activeReplyId === comment._id && (
          <div className="flex gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-850/80 shadow-sm" style={{ marginLeft: `${Math.min((depth + 1) * 20, 60)}px` }}>
            <input 
              type="text" 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-700 dark:text-slate-100 outline-none"
            />
            <button 
              onClick={() => handlePostReply(comment._id)}
              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setActiveReplyId(null)}
              className="text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Recursive rendering of replies */}
        {comment.replies && comment.replies.length > 0 && renderCommentsList(comment.replies, depth + 1)}
      </div>
    ));
  };

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-200 rounded-[18px] p-4 sm:p-6 shadow-sm hover:shadow-md transition-all text-left"
    >
      {/* Header: Author & Institution */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-blue-600 overflow-hidden shrink-0 border border-slate-200">
            {pub.userId?.profileImage ? (
              <img src={pub.userId.profileImage} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <span>{pub.authors ? pub.authors[0] : 'R'}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-slate-900 truncate">
                {pub.authors ? pub.authors.split(',')[0] : 'Unknown Researcher'}
              </span>
              <span className="text-blue-500 bg-blue-50 p-0.5 rounded-full shrink-0" title="Verified Author">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate">
              {pub.userId?.institution || 'Academic Institute'} • {pub.year || '2026'}
            </p>
          </div>
        </div>

        {/* Research Score Badge */}
        <div className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/60 px-2.5 py-1 rounded-full shrink-0">
          <Award className="w-4 h-4 text-blue-600" />
          <span className="text-[11px] font-extrabold text-blue-700">
            Score: {pub.researchScore || '24'}
          </span>
        </div>
      </div>

      {/* Publication Title */}
      <h3 
        onClick={() => setIsAiModalOpen(true)}
        className="font-extrabold text-lg text-slate-900 mt-4 leading-snug hover:text-blue-600 transition-colors cursor-pointer"
      >
        {pub.title}
      </h3>

      {/* Abstract Preview */}
      {pub.abstract && (
        <div className="mt-3">
          <p className={`text-sm text-slate-600 leading-relaxed ${!showAbstract ? 'line-clamp-2' : ''}`}>
            {pub.abstract}
          </p>
          <button 
            onClick={() => setShowAbstract(!showAbstract)}
            className="flex items-center gap-1 text-xs text-blue-600 font-extrabold mt-1.5 hover:underline"
          >
            {showAbstract ? (
              <>Show Less <ChevronUp className="w-3.5 h-3.5" /></>
            ) : (
              <>Read Abstract <ChevronDown className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>
      )}

      {/* Metadata Tags (Journal, Publisher, Reading Time) */}
      <div className="flex flex-wrap gap-2 mt-4 text-[11px] font-semibold text-slate-500">
        {pub.publication && (
          <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md">
            Journal: {pub.publication}
          </span>
        )}
        <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md">
          {pub.readingTime || 5} min read
        </span>
      </div>

      {/* Keywords Cloud */}
      {pub.keywords && pub.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {pub.keywords.map((tag, idx) => (
            <span 
              key={idx} 
              className="px-2 py-0.5 bg-blue-50/50 text-blue-600 border border-blue-100/30 rounded-md text-[10px] font-bold"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Publication Metrics */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:gap-4 border-t border-b border-slate-100 py-3 mt-5 text-[11px] sm:text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1 sm:gap-1.5">
          <Quote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
          <strong className="text-slate-900">{pub.citations || 0}</strong> Citations
        </span>
        <span className="flex items-center gap-1 sm:gap-1.5">
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 shrink-0" />
          <strong className="text-slate-900">{pub.views || 0}</strong> Views
        </span>
        <span className="flex items-center gap-1 sm:gap-1.5">
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
          <strong className="text-slate-900">{pub.downloads || 0}</strong> Downloads
        </span>
      </div>

      {/* Footer Actions: Interactions & AI Assistants */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
        
        {/* Core Actions */}
        <div className="flex items-center space-x-2">
          
          {/* Like */}
          <button 
            onClick={handleLike}
            className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${
              pub.liked 
                ? 'bg-rose-50 text-rose-600' 
                : 'hover:bg-slate-50 text-slate-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${pub.liked ? 'fill-current' : ''}`} />
            <span>{pub.liked ? 'Liked' : 'Like'}</span>
          </button>

          {/* Comment */}
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${
              showComments
                ? 'bg-indigo-50 text-indigo-650'
                : 'hover:bg-slate-50 text-slate-500'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Comment</span>
          </button>

          {/* Bookmark */}
          <button 
            onClick={() => setIsBookmarkModalOpen(true)}
            className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${
              pub.bookmarked
                ? 'bg-amber-50 text-amber-600'
                : 'hover:bg-slate-50 text-slate-500'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${pub.bookmarked ? 'fill-current' : ''}`} />
            <span>{pub.bookmarked ? 'Saved' : 'Save'}</span>
          </button>

          {/* Share */}
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(pub.paperURL || window.location.href);
                toast.success('Link copied to clipboard!');
              } catch {
                toast.error('Failed to copy link');
              }
            }}
            className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 transition-all text-xs font-bold"
            title="Share Paper"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* AI & Premium PDF tools */}
        <div className="flex items-center flex-wrap gap-1.5">
          
          {/* Cite */}
          <button 
            onClick={handleCite}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            Cite
          </button>

          {/* PDF */}
          <button 
            onClick={downloadPdf}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/50 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" /> PDF
          </button>

        </div>
      </div>

      {/* Nested Comments Drawer */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-5 pt-5 border-t border-slate-100 space-y-4"
          >
            <h4 className="font-bold text-xs text-slate-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              Discussions
            </h4>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="flex gap-2">
              <input 
                type="text" 
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Post a scholarly comment or question..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
              <button 
                type="submit" 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-4 pt-2">
              {commentsList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">No comments yet. Start the conversation!</p>
              ) : (
                renderCommentsList(commentsList)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Analysis Modal */}
      <AiAnalysisModal 
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        publication={pub}
      />

      {/* Bookmark Folders Modal */}
      <BookmarkFoldersModal
        isOpen={isBookmarkModalOpen}
        onClose={() => setIsBookmarkModalOpen(false)}
        folders={['General', 'Quantum Physics', 'Machine Learning', 'Medical Assessment']}
        onSelectFolder={handleSelectBookmarkFolder}
        initialFolder="General"
      />

    </motion.div>
  );
});

PublicationCard.displayName = 'PublicationCard';

export default React.memo(PublicationCard);