import React, { useState, useCallback } from 'react';
import {
  Download, Maximize2, Minimize2, ExternalLink, Loader2, FileText
} from 'lucide-react';

const PDFViewer = ({ pdfUrl, title = 'Publication', onDownload }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // Build a Google Docs viewer URL as fallback for broad browser support
  const viewerUrl = pdfUrl
    ? `https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`
    : null;

  const handleLoad = useCallback(() => {
    setIframeLoaded(true);
  }, []);

  if (!pdfUrl) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 min-h-[400px] shadow-sm">
        <FileText className="w-12 h-12 text-slate-200" />
        <p className="text-sm font-bold text-slate-400">No PDF document attached</p>
        <p className="text-xs text-slate-400 max-w-xs text-center leading-relaxed">
          This publication was uploaded as metadata only. The full-text PDF is not available.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : 'min-h-[620px]'
    }`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-xs font-bold text-slate-700 truncate max-w-xs">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
          {onDownload && (
            <button
              onClick={onDownload}
              title="Download PDF"
              className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-200 px-2.5 py-1.5 rounded-lg transition-all"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          )}
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </a>
          <button
            onClick={() => setIsFullscreen(v => !v)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg transition-all"
          >
            {isFullscreen ? (
              <><Minimize2 className="w-3 h-3" /> Exit</>
            ) : (
              <><Maximize2 className="w-3 h-3" /> Fullscreen</>
            )}
          </button>
        </div>
      </div>

      {/* Loading spinner overlay */}
      {!iframeLoaded && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-slate-50">
          <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-500 font-bold">Loading document…</p>
        </div>
      )}

      {/* PDF iframe */}
      <iframe
        src={viewerUrl}
        title={`PDF: ${title}`}
        className={`w-full flex-1 border-0 transition-opacity duration-300 ${
          iframeLoaded ? 'opacity-100' : 'opacity-0 absolute'
        } ${isFullscreen ? 'h-[calc(100vh-56px)]' : 'min-h-[560px]'}`}
        onLoad={handleLoad}
        allow="fullscreen"
        style={{ height: isFullscreen ? 'calc(100vh - 56px)' : 620 }}
      />
    </div>
  );
};

export default PDFViewer;
