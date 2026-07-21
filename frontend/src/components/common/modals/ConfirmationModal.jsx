import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const ConfirmationModal = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = '',
  description = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary', // 'primary', 'warning', 'danger'
  loading = false,
  requireTextInput = '',
  icon = null
}) => {
  const [inputText, setInputText] = useState('');

  // Reset confirmation text input when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setInputText('');
    }
  }, [isOpen]);

  const isConfirmDisabled = loading || (requireTextInput && inputText !== requireTextInput);

  const getConfirmButtonClasses = () => {
    if (variant === 'danger') {
      return 'bg-accent-red hover:bg-red-650 text-white focus:ring-accent-red';
    }
    if (variant === 'warning') {
      return 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500';
    }
    return 'bg-primary hover:bg-primary-hover text-white focus:ring-primary';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      preventClose={loading}
    >
      <div className="space-y-4 text-left">
        <div className="flex items-start gap-3">
          {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
          <p className="text-xs text-text-secondary leading-relaxed font-semibold">
            {description}
          </p>
        </div>

        {requireTextInput && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-text-primary font-bold">
              To proceed, please type <span className="text-accent-red font-black uppercase">{requireTextInput}</span> below:
            </p>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Type ${requireTextInput} to confirm`}
              disabled={loading}
              className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 text-text-primary rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirmDisabled}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${getConfirmButtonClasses()}`}
          >
            {loading && (
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
