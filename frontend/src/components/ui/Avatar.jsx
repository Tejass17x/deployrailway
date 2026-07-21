import React, { useState, useEffect, memo } from 'react';

// ─── Color Palette (deterministic per user) ───────────────────────────────────
const GRADIENTS = [
  ['#2563EB', '#4F46E5'],  // Blue → Indigo
  ['#059669', '#0D9488'],  // Emerald → Teal
  ['#7C3AED', '#A855F7'],  // Purple → Violet
  ['#E11D48', '#F43F5E'],  // Rose → Pink
  ['#D97706', '#F59E0B'],  // Amber → Yellow
  ['#0891B2', '#06B6D4'],  // Cyan → Sky
  ['#1D4ED8', '#2563EB'],  // Blue deep → Blue
  ['#0F766E', '#14B8A6'],  // Teal dark → Teal
];

const getGradientForName = (name = '') => {
  if (!name) return GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
};

const getInitials = (name = '') => {
  if (!name || typeof name !== 'string') return 'RC';
  const cleaned = name.trim();
  if (!cleaned) return 'RC';
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
  return cleaned.charAt(0).toUpperCase();
};

// ─── Size Map ─────────────────────────────────────────────────────────────────
const SIZE_MAP = {
  xs:   { container: 'w-5 h-5',   text: '14', dot: 'w-2 h-2 border' },
  sm:   { container: 'w-8 h-8',   text: '22', dot: 'w-2.5 h-2.5 border border-white' },
  md:   { container: 'w-10 h-10', text: '28', dot: 'w-3 h-3 border border-white' },
  lg:   { container: 'w-12 h-12', text: '32', dot: 'w-3 h-3 border-2 border-white' },
  xl:   { container: 'w-16 h-16', text: '42', dot: 'w-3.5 h-3.5 border-2 border-white' },
  '2xl':{ container: 'w-20 h-20', text: '52', dot: 'w-4 h-4 border-2 border-white' },
  '3xl':{ container: 'w-24 h-24', text: '60', dot: 'w-4 h-4 border-2 border-white' },
  full: { container: 'w-full h-full', text: '60', dot: 'w-4 h-4 border-2 border-white' },
};

/**
 * Universal UserAvatar component.
 *
 * Accepts either:
 *   (A) a `user` object  — extracts profileImage, fullName, firstName, lastName, isOnline automatically
 *   (B) individual props — src, name, isOnline (for places that don't have a user object)
 *
 * Never shows a broken image. Always falls back to a beautiful gradient SVG with initials.
 *
 * Props:
 *   user        {object}  — user object (preferred)
 *   src         {string}  — override image URL (when no user object)
 *   name        {string}  — override display name (for initials)
 *   size        {string}  — 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
 *   isOnline    {boolean} — show green presence dot
 *   showStatus  {boolean} — alias for isOnline
 *   showBorder  {boolean} — show a subtle ring border around the avatar
 *   shape       {string}  — Tailwind class e.g. 'rounded-full' (default) or 'rounded-2xl'
 *   className   {string}  — extra classes on the container
 */
const UserAvatar = memo(({
  user,
  src,
  name,
  size = 'md',
  isOnline,
  showStatus,
  showBorder = false,
  shape = 'rounded-full',
  className = '',
}) => {
  // ── Resolve values from user object or individual props ──────────────────
  let resolvedSrc = src ?? user?.profileImage ?? user?.avatar ?? null;
  if (resolvedSrc && typeof resolvedSrc === 'object') {
    resolvedSrc = resolvedSrc.url || resolvedSrc.thumbnail || null;
  }

  const resolvedName =
    name ??
    user?.fullName ??
    (user?.firstName || user?.lastName
      ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()
      : null) ??
    user?.username ??
    'User';
  const resolvedOnline = (isOnline ?? showStatus ?? user?.isOnline ?? user?.online ?? false);

  // ── Image error state with retry-on-failure ──────────────────────────────
  const [imgError, setImgError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);
  const [retried, setRetried] = useState(false);

  // Reset error when src changes (user uploads new photo)
  useEffect(() => {
    setImgError(false);
    setCurrentSrc(resolvedSrc);
    setRetried(false);
  }, [resolvedSrc]);

  const handleImageError = () => {
    if (!retried && resolvedSrc) {
      const separator = resolvedSrc.includes('?') ? '&' : '?';
      setCurrentSrc(`${resolvedSrc}${separator}retry=1`);
      setRetried(true);
    } else {
      setImgError(true);
    }
  };

  // ── Derived values ───────────────────────────────────────────────────────
  const initials = getInitials(resolvedName);
  const [gradStart, gradEnd] = getGradientForName(resolvedName);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;
  const gradId = `ua-grad-${initials}-${gradStart.replace('#', '')}`;

  const showImage = currentSrc && !imgError;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className={`relative flex-shrink-0 ${sizeConfig.container} ${className}`}
      aria-label={resolvedName}
    >
      {/* Avatar shell */}
      <div
        className={`w-full h-full overflow-hidden ${shape} flex items-center justify-center select-none ${showBorder ? 'ring-2 ring-offset-1 ring-blue-500/30' : ''}`}
      >
        {showImage ? (
          <img
            src={currentSrc}
            alt={resolvedName}
            onError={handleImageError}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          /* Gradient SVG initials fallback — pixel-perfect, no external requests */
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={gradStart} />
                <stop offset="100%" stopColor={gradEnd} />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill={`url(#${gradId})`} />
            <text
              x="50"
              y="53"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={sizeConfig.text}
              fontWeight="800"
              fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
              letterSpacing="2"
            >
              {initials}
            </text>
          </svg>
        )}
      </div>

      {/* Online presence dot */}
      {resolvedOnline && (
        <span
          className={`absolute bottom-0 right-0 ${sizeConfig.dot} bg-emerald-500 rounded-full shadow-sm`}
          title="Online"
        />
      )}
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

// Named export for backward compat with existing Avatar imports
export { UserAvatar as Avatar };

export default UserAvatar;
