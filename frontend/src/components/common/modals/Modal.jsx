import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from '../buttons/Button';

const Modal = ({
  isOpen = false,
  onClose,
  title = '',
  children,
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  className = '',
  preventClose = false
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !preventClose && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, preventClose, onClose]);

  const sizeWidths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-5xl'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !preventClose && onClose && onClose()}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`w-full ${sizeWidths[size]} bg-bg-card border border-border rounded-2xl shadow-xl overflow-hidden relative z-10 ${className}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              {title ? (
                <h3 className="text-lg font-bold text-text-primary">{title}</h3>
              ) : (
                <div />
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={preventClose}
                icon={<X className="w-5 h-5" />}
                className="!p-1.5 rounded-full"
              />
            </div>

            {/* Content */}
            <div className="px-6 py-6 max-h-[75vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
