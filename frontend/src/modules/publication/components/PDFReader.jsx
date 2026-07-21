import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, ZoomOut, Maximize2, Minimize2, Download, ExternalLink,
  Copy, Bookmark, ChevronLeft, ChevronRight, Eye, Check, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Estimate of one rendered PDF page's height in px at 100% zoom.
// Used only to size the iframe tall enough to show the whole document
// without the iframe needing its own internal scroll.
const PAGE_HEIGHT_ESTIMATE = 860;

const PDFReader = ({ title, pdfUrl, authors, journal, year, doi, onDownload }) => {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);

  // States
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(null); // null = still detecting
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(null);

  // --- Real page-count detection --------------------------------------
  // We don't ship pdf.js, so instead we fetch the raw PDF bytes and count
  // "/Type /Page" object occurrences (excluding "/Type /Pages", the
  // parent tree node). This works for the vast majority of non-encrypted
  // PDFs. If the fetch fails (e.g. blocked by CORS on a remote host),
  // we fall back to a sane default so the UI still works.
  useEffect(() => {
    let cancelled = false;
    setTotalPages(null);

    if (!pdfUrl) return;

    const detectPageCount = async () => {
      try {
        const res = await fetch(pdfUrl);
        if (!res.ok) throw new Error('fetch failed');
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        // Decode as latin1 so byte offsets map 1:1 to chars — good enough
        // for scanning PDF object dictionaries, which are ASCII.
        let text = '';
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
          text += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        const matches = text.match(/\/Type\s*\/Page(?!s)/g);
        const count = matches ? matches.length : 0;
        if (!cancelled) setTotalPages(count > 0 ? count : 1);
      } catch (err) {
        console.warn('Page count detection failed, using fallback:', err);
        if (!cancelled) setTotalPages(6);
      }
    };

    detectPageCount();
    return () => { cancelled = true; };
  }, [pdfUrl]);

  const effectiveTotalPages = totalPages ?? 1;

  // Mobile browsers resize the visual viewport when the address bar
  // shows/hides, and `dvh` doesn't always track this outside real
  // Fullscreen mode. Measure the real viewport in JS as a reliable
  // fallback for the outer container's height.
  useEffect(() => {
    const measure = () => {
      const vv = window.visualViewport;
      setViewportHeight(vv ? vv.height : window.innerHeight);
    };
    measure();
    window.visualViewport?.addEventListener('resize', measure);
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    return () => {
      window.visualViewport?.removeEventListener('resize', measure);
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  // We intentionally do NOT rely on the iframe's own internal PDF-viewer
  // scroll — on many mobile browsers, touch events don't propagate into
  // a nested iframe's scroll layer reliably outside real Fullscreen mode.
  // Instead the iframe is rendered tall enough to show the entire
  // document with no internal scrollbar, and this outer div (a plain
  // element, not an iframe) is the only thing that scrolls.
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? Math.min(100, Math.round((scrollTop / maxScroll) * 100)) : 0;
      setReadProgress(progress);

      const pageHeight = maxScroll > 0 ? maxScroll / effectiveTotalPages : 1;
      const estPage = Math.min(effectiveTotalPages, Math.max(1, Math.ceil(scrollTop / pageHeight)));
      setCurrentPage(estPage);
    };

    const el = scrollRef.current;
    el?.addEventListener('scroll', handleScroll, { passive: true });
    return () => el?.removeEventListener('scroll', handleScroll);
  }, [effectiveTotalPages]);

  // Fullscreen Toggler
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        toast.error('Fullscreen mode failed.');
        console.error(err);
      });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // APA Citation generator
  const copyCitation = () => {
    const authorNames = authors || 'Researcher';
    const pubYear = year || new Date().getFullYear();
    const venue = journal || 'Research Connect Database';
    const doiSuffix = doi ? `. https://doi.org/${doi}` : '';
    const citation = `${authorNames}. (${pubYear}). ${title}. ${venue}${doiSuffix}`;
    navigator.clipboard.writeText(citation);
    setCopySuccess(true);
    toast.success('APA Citation copied to clipboard!');
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Open PDF in a new browser tab/window
  const openInNewTab = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  // Zoom handlers
  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(prev + 20, 200)), []);
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(prev - 20, 50)), []);

  // Page navigation — scrolls the outer container by one estimated page.
  const navigatePage = (direction) => {
    if (!scrollRef.current) return;
    const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
    const step = (scrollHeight - clientHeight) / effectiveTotalPages;
    let target = scrollTop;
    if (direction === 'next' && currentPage < effectiveTotalPages) target = Math.min(scrollHeight, scrollTop + step);
    if (direction === 'prev' && currentPage > 1) target = Math.max(0, scrollTop - step);
    scrollRef.current.scrollTo({ top: target, behavior: 'smooth' });
  };

  // Outer container height fallback for non-fullscreen mode
  const containerStyle =
    !isFullscreen && viewportHeight
      ? { height: Math.round(viewportHeight * 0.75), minHeight: 500 }
      : undefined;

  // Available height for the scroll viewport (container minus header rows/progress/footer)
  const chromeHeight = 148; // two header rows (~104) + progress bar (~4) + footer (~40), approx
  const viewportBoxHeight = viewportHeight
    ? Math.round((isFullscreen ? viewportHeight : viewportHeight * 0.75) - chromeHeight)
    : 500;

  // Iframe rendered tall enough to contain the whole doc at current zoom,
  // so its own internal viewer never needs to scroll.
  const iframeHeight = Math.max(
    viewportBoxHeight,
    Math.round(effectiveTotalPages * PAGE_HEIGHT_ESTIMATE * (zoom / 100))
  );

  return (
    <div 
      ref={containerRef}
      className={`bg-slate-900 flex flex-col rounded-2xl sm:rounded-3xl border border-slate-800 overflow-hidden shadow-xl transition-all min-h-0 ${
        isFullscreen ? 'w-screen h-[100dvh] rounded-none' : 'w-full min-h-[500px] h-[70dvh] sm:h-[75vh]'
      }`}
      style={containerStyle}
    >

      {/* 1. Header Toolbar — split into two rows so page number / zoom
          never get squeezed off-screen or wrapped away on mobile. */}
      <div className="bg-slate-950 border-b border-slate-800/80 z-10 shrink-0">

        {/* Row 1: Title + destructive/utility actions */}
        <div className="flex items-center justify-between gap-2 px-3 pt-2.5 sm:px-4 sm:pt-3">
          <span className="text-[11px] sm:text-xs font-bold text-slate-300 truncate min-w-0">{title}</span>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={copyCitation}
              className="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
              title="Copy APA Citation"
            >
              {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Cite</span>
            </button>

            <button
              onClick={() => {
                setIsBookmarked(!isBookmarked);
                toast.success(isBookmarked ? 'Bookmark removed.' : 'Page bookmarked successfully.');
              }}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors border ${
                isBookmarked 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-600/10' 
                  : 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Bookmark publication"
            >
              <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={openInNewTab}
              className="p-1.5 sm:p-2 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={onDownload}
              className="p-1.5 sm:p-2 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>

        {/* Row 2: Page navigation + zoom, always visible on its own row */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              onClick={() => navigatePage('prev')}
              disabled={currentPage === 1}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 whitespace-nowrap">
              {totalPages === null ? 'Page …' : `Page ${currentPage} of ${totalPages}`}
            </span>
            <button
              onClick={() => navigatePage('next')}
              disabled={currentPage === effectiveTotalPages}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 min-w-[32px] text-center">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Reading progress bar */}
      <div className="w-full bg-slate-950 h-1 overflow-hidden relative border-b border-slate-900 shrink-0">
        <div 
          className="bg-blue-600 h-full transition-all duration-100"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* 3. Document Canvas Area — this div is the ONLY scroll container.
          The iframe below is rendered tall enough to show the full
          document with no internal scrollbar, so all scrolling here is
          plain native div scrolling (reliably touch-scrollable on every
          mobile browser, in or out of fullscreen). */}
      <div 
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain relative bg-slate-900/60"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          height: viewportBoxHeight,
        }}
      >
        {!iframeLoaded && pdfUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/60 z-10">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading document…</p>
          </div>
        )}
        {pdfUrl ? (
          <div
            className="transition-all duration-150 origin-top mx-auto p-4 sm:p-6"
            style={{ width: `${zoom}%`, minWidth: '100%' }}
          >
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              title={title}
              onLoad={() => setIframeLoaded(true)}
              scrolling="no"
              className={`w-full border-0 rounded-2xl bg-white shadow-xl transition-opacity duration-300 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{
                height: iframeHeight,
                pointerEvents: 'none', // clicks/scroll pass through to the outer scroller
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-bold uppercase tracking-wider">Loading PDF Canvas...</p>
          </div>
        )}
      </div>

      {/* 4. Sticky footer progress indicator */}
      <div className="bg-slate-950 px-3 sm:px-4 py-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest z-10 shrink-0">
        <span className="truncate">{title}</span>
        <span className="flex items-center gap-1 text-slate-400 shrink-0">
          <Eye className="w-3.5 h-3.5" /> Progress {readProgress}%
        </span>
      </div>

    </div>
  );
};

export default PDFReader;