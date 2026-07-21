import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Download, X, CheckCheck, ChevronDown, Quote, ExternalLink, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import citationService from '../../../services/citation.service';

const FORMATS = [
  { key: 'APA7',      label: 'APA 7th',    group: 'Author-Date',  ext: 'txt' },
  { key: 'APA6',      label: 'APA 6th',    group: 'Author-Date',  ext: 'txt' },
  { key: 'MLA',       label: 'MLA',        group: 'Author-Date',  ext: 'txt' },
  { key: 'Harvard',   label: 'Harvard',    group: 'Author-Date',  ext: 'txt' },
  { key: 'Chicago',   label: 'Chicago',    group: 'Footnote',     ext: 'txt' },
  { key: 'Vancouver', label: 'Vancouver',  group: 'Numeric',      ext: 'txt' },
  { key: 'IEEE',      label: 'IEEE',       group: 'Numeric',      ext: 'txt' },
  { key: 'BibTeX',    label: 'BibTeX',     group: 'Export',       ext: 'bib' },
  { key: 'RIS',       label: 'RIS',        group: 'Export',       ext: 'ris' },
  { key: 'EndNote',   label: 'EndNote',    group: 'Export',       ext: 'enw' },
  { key: 'RefWorks',  label: 'RefWorks',   group: 'Export',       ext: 'txt' },
  { key: 'PlainText', label: 'Plain Text', group: 'Export',       ext: 'txt' },
];

const GROUPS = ['Author-Date', 'Footnote', 'Numeric', 'Export'];

const CitationExport = ({ publicationId, publicationTitle, isOpen, onClose }) => {
  const [citations, setCitations] = useState({});
  const [activeFormat, setActiveFormat] = useState('APA7');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [activeGroup, setActiveGroup] = useState('Author-Date');

  const loadCitations = async () => {
    setIsLoading(true);
    try {
      const data = await citationService.getAllCitations(publicationId);
      setCitations(data.citations || {});
    } catch {
      toast.error('Failed to load citations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !publicationId) return;
    loadCitations();
  }, [isOpen, publicationId]);

  const currentCitation = citations[activeFormat] || '';

  const handleCopy = async () => {
    if (!currentCitation) return;
    try {
      await navigator.clipboard.writeText(currentCitation);
      setCopiedKey(activeFormat);
      setTimeout(() => setCopiedKey(''), 2500);
      toast.success('Citation copied!');
      citationService.trackEvent(publicationId, activeFormat, 'copy').catch(() => {});
    } catch {
      toast.error('Failed to copy.');
    }
  };

  const handleDownload = () => {
    if (!currentCitation) return;
    const format = FORMATS.find(f => f.key === activeFormat);
    const ext = format?.ext || 'txt';
    const mimeMap = { bib: 'application/x-bibtex', ris: 'application/x-research-info-systems', txt: 'text/plain' };
    const blob = new Blob([currentCitation], { type: mimeMap[ext] || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (publicationTitle || 'citation').replace(/[^a-z0-9]/gi, '_').slice(0, 40);
    a.href = url;
    a.download = `${safeName}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    citationService.trackEvent(publicationId, activeFormat, 'download').catch(() => {});
    toast.success(`Downloaded as .${ext}`);
  };

  const handleExportAll = () => {
    const allText = FORMATS.map(f => {
      const c = citations[f.key] || '';
      return `=== ${f.label} ===\n${c}`;
    }).join('\n\n');
    const blob = new Blob([allText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_citations.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('All citations exported!');
  };

  const formatsInGroup = FORMATS.filter(f => f.group === activeGroup);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Quote className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Cite This Publication</h2>
                  <p className="text-xs text-gray-400 truncate max-w-xs">{publicationTitle}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Group Tabs */}
            <div className="flex items-center gap-1 px-6 pt-4 overflow-x-auto no-scrollbar">
              {GROUPS.map(group => (
                <button
                  key={group}
                  onClick={() => {
                    setActiveGroup(group);
                    const first = FORMATS.find(f => f.group === group);
                    if (first) setActiveFormat(first.key);
                  }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                    activeGroup === group ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>

            {/* Format Pills */}
            <div className="flex items-center gap-2 px-6 pt-3 flex-wrap">
              {formatsInGroup.map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFormat(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    activeFormat === f.key
                      ? 'bg-blue-50 text-blue-700 border-blue-300'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Citation Preview */}
            <div className="mx-6 mt-4 mb-4 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
              {isLoading ? (
                <div className="p-6 space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                  <div className="h-4 bg-gray-200 rounded w-4/6" />
                </div>
              ) : (
                <div className="relative group">
                  <pre className="p-5 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-sans break-words max-h-44 overflow-y-auto">
                    {currentCitation || 'Citation not available.'}
                  </pre>
                  {currentCitation && (
                    <button
                      onClick={handleCopy}
                      className="absolute top-3 right-3 p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:border-blue-400 hover:text-blue-600"
                      title="Copy"
                    >
                      {copiedKey === activeFormat
                        ? <CheckCheck className="w-4 h-4 text-green-500" />
                        : <Copy className="w-4 h-4 text-gray-500" />
                      }
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 px-6 pb-6">
              <button
                onClick={handleExportAll}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
              >
                <FileText className="w-4 h-4" />
                Export All
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!currentCitation || isLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!currentCitation || isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {copiedKey === activeFormat
                    ? <><CheckCheck className="w-4 h-4" /> Copied!</>
                    : <><Copy className="w-4 h-4" /> Copy Citation</>
                  }
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CitationExport;
