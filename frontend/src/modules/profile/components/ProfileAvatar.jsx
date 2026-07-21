import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, X } from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';

/**
 * ProfileAvatar
 * Shows the profile photo with a hover-overlay "Change" button.
 * Clicking the button calls onAvatarChange() — which opens the ImageUploadModal upstream.
 * No file picking logic here; all that lives in ProfileOverview.
 *
 * When not editable (viewing someone else's profile), clicking the avatar
 * opens a lightbox showing the picture enlarged.
 */
const ProfileAvatar = ({ imageUrl, name, onAvatarChange, editable = true, uploading = false }) => {
  const [showLightbox, setShowLightbox] = useState(false);

  // Lock background scroll and allow Escape-to-close while the lightbox is open.
  useEffect(() => {
    if (!showLightbox) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowLightbox(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLightbox]);

  return (
    <>
      <div className="relative group rounded-full overflow-hidden w-28 h-28 sm:w-36 sm:h-36 border-4 border-white shadow-lg bg-white flex-shrink-0">
        {/* Profile image */}
        <Avatar
          src={imageUrl}
          name={name}
          size="full"
          className="transition-transform duration-500 group-hover:scale-105"
        />

        {/* Upload loading spinner */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Hover overlay — opens the ImageUploadModal */}
        {editable && !uploading && (
          <button
            type="button"
            onClick={() => onAvatarChange && onAvatarChange()}
            className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center gap-1 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
          >
            <Camera className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
          </button>
        )}

        {/* View-only overlay — opens the lightbox for other users' pictures */}
        {!editable && !uploading && imageUrl && (
          <button
            type="button"
            onClick={() => setShowLightbox(true)}
            className="absolute inset-0 bg-black/25 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-zoom-in"
            title="View photo"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider">View</span>
          </button>
        )}
      </div>

      {/* Rendered via portal so it sits above EVERYTHING (navbar, back button, etc.),
          regardless of any transformed/stacking-context ancestors (e.g. framer-motion). */}
      {showLightbox && imageUrl && createPortal(
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          style={{ zIndex: 9999 }}
          onClick={() => setShowLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setShowLightbox(false)}
            aria-label="Close"
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full p-2.5 transition-colors"
            style={{ zIndex: 10000 }}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={imageUrl}
            alt={name}
            className="max-w-[92vw] max-h-[85vh] rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </>
  );
};

export default ProfileAvatar;