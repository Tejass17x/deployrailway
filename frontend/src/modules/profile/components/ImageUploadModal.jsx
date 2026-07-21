import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';

/**
 * ImageUploadModal
 * ─────────────────────────────────────────────────────────────
 * A premium drag-and-drop image upload modal with:
 *  - Drag & drop or click-to-browse
 *  - Instant local preview
 *  - Real-time upload progress bar
 *  - Cancel / Retry support
 *  - Supports 'avatar' and 'banner' presets
 *
 * Props:
 *  isOpen      {boolean}  - Controls visibility
 *  onClose     {fn}       - Called when modal is dismissed
 *  onUpload    {fn}       - async (file) => void  — called with the selected File
 *  title       {string}   - Modal header title
 *  hint        {string}   - Subtitle hint text
 *  accept      {string}   - MIME types for file input (default: "image/jpeg,image/png,image/webp")
 *  aspectHint  {string}   - Aspect ratio hint to show user (e.g. "Square (1:1)" or "16:3")
 *  uploading   {boolean}  - External uploading state
 *  progress    {number}   - Upload progress 0–100
 */
const ImageUploadModal = ({
  isOpen,
  onClose,
  onUpload,
  title = 'Upload Image',
  hint = 'Drag & drop or click to browse',
  accept = 'image/jpeg,image/png,image/webp',
  aspectHint = '',
  uploading = false,
  progress = 0
}) => {
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef(null);

  const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_SIZE_MB = 10;

  const validateAndPreview = (file) => {
    setError('');
    setUploaded(false);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Unsupported format. Please upload a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndPreview(file);
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) validateAndPreview(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;
    setError('');
    try {
      await onUpload(selectedFile);
      setUploaded(true);
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
    }
  };

  const handleClose = () => {
    if (uploading) return; // Block close during active upload
    setPreview(null);
    setSelectedFile(null);
    setError('');
    setUploaded(false);
    onClose();
  };

  const handleRetry = () => {
    setPreview(null);
    setSelectedFile(null);
    setError('');
    setUploaded(false);
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
       <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-[2px] p-4"
  onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
>
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">{title}</h3>
                {aspectHint && (
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Recommended: {aspectHint}
                  </p>
                )}
              </div>
              <button
                onClick={handleClose}
                disabled={uploading}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Drop Zone */}
              {!preview && (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl h-48 cursor-pointer transition-all duration-200
                    ${isDragging
                      ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                      : 'border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
                >
                  <div className={`p-3 rounded-2xl transition-colors ${isDragging ? 'bg-blue-100' : 'bg-white border border-slate-200'}`}>
                    <Upload className={`w-6 h-6 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">{hint}</p>
                    <p className="text-[11px] text-slate-400 mt-1">JPG, PNG, WEBP · Max {MAX_SIZE_MB}MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}

              {/* Preview */}
              {preview && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-64 object-contain"
                  />
                  {!uploading && !uploaded && (
                    <button
                      onClick={handleRetry}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg text-[10px] flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Change
                    </button>
                  )}
                  {/* File info */}
                  {selectedFile && (
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-white font-medium flex items-center gap-1.5">
                      <ImageIcon className="w-3 h-3" />
                      {selectedFile.name.length > 20 ? selectedFile.name.substring(0, 20) + '…' : selectedFile.name}
                      · {(selectedFile.size / 1024).toFixed(0)} KB
                    </div>
                  )}
                </div>
              )}

              {/* Progress Bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                    <span>Uploading to Cloudflare R2…</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: 'easeOut', duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Success */}
              {uploaded && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5"
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-bold">Image uploaded successfully!</span>
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-xs font-semibold">{error}</span>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {!uploaded ? (
                  <>
                  <button
  onClick={handleClose}
  disabled={uploading}
  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
>
  <X className="w-3.5 h-3.5" />
  Cancel
</button>
                    <button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          Upload to Cloud
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleClose}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Done
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageUploadModal;
