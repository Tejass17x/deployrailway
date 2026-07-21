import React, { useState } from 'react';
import { Share2, Copy, Check, Twitter, Linkedin, Facebook, Link2, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import publicationService from '../../../services/publication.service';

const SharePanel = ({ publication }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!publication) return null;

  const url = `${window.location.origin}/publications/${publication.slug}`;
  const title = encodeURIComponent(publication.title || '');
  const summary = encodeURIComponent(`Check out this research publication on Research Connect: ${publication.title}`);

  const PLATFORMS = [
    {
      id: 'twitter',
      label: 'Twitter / X',
      icon: Twitter,
      color: 'hover:text-sky-500',
      href: `https://twitter.com/intent/tweet?text=${summary}&url=${encodeURIComponent(url)}`,
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      icon: Linkedin,
      color: 'hover:text-blue-600',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      color: 'hover:text-blue-500',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      color: 'hover:text-emerald-600',
      href: `mailto:?subject=${title}&body=${summary}%0A%0A${encodeURIComponent(url)}`,
    },
  ];

  const handleShare = async (platform, href) => {
    try {
      await publicationService.trackShare(publication._id || publication.id, platform);
    } catch {}
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      await publicationService.trackShare(publication._id || publication.id, 'copy-link');
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link.');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 px-3.5 py-2 rounded-xl transition-all shadow-xs"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-slate-200 rounded-2xl shadow-lg p-4 space-y-3 min-w-[220px]">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Share This Publication
            </p>

            {/* Platform Buttons */}
            <div className="space-y-1">
              {PLATFORMS.map(({ id, label, icon: Icon, color, href }) => (
                <button
                  key={id}
                  onClick={() => handleShare(id, href)}
                  className={`w-full flex items-center gap-2.5 text-xs font-semibold text-slate-600 ${color} hover:bg-slate-50 px-3 py-2 rounded-xl transition-all text-left`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-2">
              {/* Copy link */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                <Link2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="flex-1 text-[10px] text-slate-500 font-mono truncate">{url}</span>
                <button
                  onClick={handleCopyLink}
                  className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex-shrink-0"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SharePanel;
