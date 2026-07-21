import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Eye, Download, Quote, Heart, Bookmark, Share2,
  MessageCircle, Star, ExternalLink, User, Building2, Tag, Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import feedService from '../../../services/feed.service';
import Avatar from '../../../components/ui/Avatar';

const PublicationFeedCard = ({ event, onInteraction }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(event.engagementCount?.likes || 0);
  const [bookmarkCount, setBookmarkCount] = useState(event.engagementCount?.bookmarks || 0);

  const meta = event.metadata || {};
  const actor = event.actor || {};

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      if (event.entityId) {
        await feedService.toggleLike(event.entityId);
      }
      setLiked(prev => !prev);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
      onInteraction?.(event._id, 'like');
    } catch { toast.error('Could not like.'); }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    try {
      if (event.entityId) {
        await feedService.toggleBookmark(event.entityId);
      }
      setBookmarked(prev => !prev);
      setBookmarkCount(prev => bookmarked ? prev - 1 : prev + 1);
      onInteraction?.(event._id, 'bookmark');
      toast.success(bookmarked ? 'Removed from bookmarks' : 'Saved to bookmarks');
    } catch { toast.error('Could not bookmark.'); }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/publications/${meta.slug || event.entityId}`);
      onInteraction?.(event._id, 'share');
      toast.success('Link copied to clipboard!');
    } catch { toast.error('Could not copy link.'); }
  };

  const handleOpen = () => {
    if (meta.slug) navigate(`/publications/${meta.slug}`);
    else navigate(`/publications`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-card border border-border-default rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer group"
      onClick={handleOpen}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar
          src={actor.profileImage}
          name={`${actor.firstName} ${actor.lastName}`}
          size="md"
          showBorder
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {actor.firstName} {actor.lastName}
            <span className="font-normal text-text-muted ml-1">published a paper</span>
          </p>
          <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
            {actor.institution && (
              <span className="flex items-center gap-1"><Building2 size={11} />{actor.institution}</span>
            )}
            <span>·</span>
            <span>{new Date(event.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
          <BookOpen size={11} />
          <span>Paper</span>
        </div>
      </div>

      {/* Publication Content */}
      <div className="mb-4">
        <h3 className="text-base font-bold text-text-primary mb-1 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {meta.title || 'Untitled Publication'}
        </h3>
        {meta.journal && (
          <p className="text-xs text-primary/80 font-medium mb-2">{meta.journal}</p>
        )}
        {meta.abstract && (
          <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">{meta.abstract}</p>
        )}
      </div>

      {/* Keywords */}
      {meta.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {meta.keywords.slice(0, 4).map((kw, i) => (
            <span key={i} className="flex items-center gap-1 text-xs bg-bg-surface text-text-muted border border-border-default px-2 py-0.5 rounded-full">
              <Tag size={9} />{kw}
            </span>
          ))}
        </div>
      )}

      {/* Metrics */}
      <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
        <span className="flex items-center gap-1"><Quote size={12} />{meta.citations || 0} citations</span>
        <span className="flex items-center gap-1"><Eye size={12} />{meta.views || 0} views</span>
        <span className="flex items-center gap-1"><Download size={12} />{meta.downloads || 0} downloads</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border-default" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <button onClick={handleLike} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${liked ? 'bg-red-500/10 text-red-400' : 'text-text-muted hover:bg-bg-surface hover:text-text-primary'}`}>
            <Heart size={14} className={liked ? 'fill-current' : ''} />{likeCount}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:bg-bg-surface hover:text-text-primary transition-all">
            <MessageCircle size={14} />{event.engagementCount?.comments || 0}
          </button>
          <button onClick={handleBookmark} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${bookmarked ? 'bg-primary/10 text-primary' : 'text-text-muted hover:bg-bg-surface hover:text-text-primary'}`}>
            <Bookmark size={14} className={bookmarked ? 'fill-current' : ''} />{bookmarkCount}
          </button>
          <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:bg-bg-surface hover:text-text-primary transition-all">
            <Share2 size={14} />
          </button>
        </div>
        <button onClick={handleOpen} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
          <ExternalLink size={13} />Read
        </button>
      </div>
    </motion.div>
  );
};

export default PublicationFeedCard;
