import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Share, ExternalLink, QrCode, Check, Link2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ShareProfileModal = ({ isOpen, onClose, profileUrl, fullName }) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const fullUrl = `${window.location.origin}${profileUrl}`;

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('Profile link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${fullName} - Researcher Profile`,
          text: `Check out the researcher profile of ${fullName} on Research Connect.`,
          url: fullUrl
        });
        toast.success('Shared successfully!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error('Sharing failed.');
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(fullUrl)}&color=2563eb&margin=10`;

  const actionButtons = [
    { key: 'copy', label: 'Copy Link', icon: Copy, onClick: handleCopyLink, variant: 'outline' },
    { key: 'share', label: 'Share Profile', icon: Share, onClick: handleNativeShare, variant: 'primary' },
    { key: 'open', label: 'Open Public', icon: ExternalLink, onClick: () => window.open(fullUrl, '_blank'), variant: 'outline' },
    { key: 'qr', label: showQr ? 'Hide QR Code' : 'Show QR Code', icon: QrCode, onClick: () => setShowQr((v) => !v), variant: showQr ? 'active' : 'outline' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-[2px]"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="bg-white rounded-3xl w-full max-w-sm flex flex-col shadow-2xl shadow-slate-900/10 overflow-hidden border border-border"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Link2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-text-primary tracking-tight">Share Researcher Profile</h3>
                  <p className="text-[10px] text-text-secondary font-medium">Share {fullName}'s academic profile page.</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={onClose}
                className="p-1.5 hover:bg-bg-page border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Share Content */}
            <div className="p-5 space-y-4">
              {/* Input Link Display */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="flex items-center gap-2 p-2 border border-border bg-bg-page/10 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all"
              >
                <input
                  type="text"
                  readOnly
                  value={fullUrl}
                  className="text-[11px] font-semibold text-text-secondary bg-transparent outline-none flex-grow overflow-hidden select-all"
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCopyLink}
                  className="p-1.5 hover:bg-bg-page rounded-lg text-primary transition-colors border border-border"
                  title="Copy Link"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={copied ? 'check' : 'copy'}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.15 }}
                      className="flex"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </motion.span>
                  </AnimatePresence>
                </motion.button>
              </motion.div>

              {/* Actions Grid */}
              <div className="grid grid-cols-2 gap-3">
                {actionButtons.map((btn, i) => {
                  const Icon = btn.icon;
                  const base = 'flex items-center justify-center gap-1.5 p-3 rounded-xl text-[11px] font-bold transition-colors';
                  const style =
                    btn.variant === 'primary'
                      ? 'bg-primary text-white hover:bg-primary-hover shadow-sm shadow-primary/25'
                      : btn.variant === 'active'
                      ? 'border border-primary/20 bg-primary/5 text-primary'
                      : 'border border-border text-text-secondary hover:bg-bg-page';
                  return (
                    <motion.button
                      key={btn.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 + i * 0.03 }}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={btn.onClick}
                      className={`${base} ${style}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {btn.label}
                    </motion.button>
                  );
                })}
              </div>

              {/* QR Code Container */}
              <AnimatePresence>
                {showQr && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="flex flex-col items-center justify-center pt-2 border-t border-border/60 overflow-hidden"
                  >
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                      className="p-3 bg-white border border-border rounded-2xl shadow-sm mt-3"
                    >
                      <img
                        src={qrCodeUrl}
                        alt="Researcher Profile QR Code"
                        className="w-40 h-40 object-contain"
                      />
                    </motion.div>
                    <p className="text-[9px] text-text-secondary font-semibold mt-2">Scan QR Code to visit profile page</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShareProfileModal;