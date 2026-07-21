import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, X } from 'lucide-react';

const FORMATS = [
  { name: 'Article', slug: 'article', description: 'Journal paper or research article.' },
  { name: 'Book', slug: 'book', description: 'Complete published monograph or volume.' },
  { name: 'Book Chapter', slug: 'book-chapter', description: 'Part of a compiled book publication.' },
  { name: 'Conference Paper', slug: 'conference-paper', description: 'Proceeding or meeting abstract.' },
  { name: 'Patent', slug: 'patent', description: 'Registered utility patent or application.' },
  { name: 'Preprint', slug: 'preprint', description: 'Early-stage paper shared before review.' }
];

const MORE_FORMATS = [
  { name: 'Presentation', slug: 'presentation' },
  { name: 'Poster', slug: 'poster' },
  { name: 'Dataset', slug: 'dataset' },
  { name: 'Method', slug: 'method' },
  { name: 'Proposal', slug: 'proposal' },
  { name: 'Technical Report', slug: 'technical-report' },
  { name: 'White Paper', slug: 'white-paper' },
  { name: 'Software', slug: 'software' },
  { name: 'Survey', slug: 'survey' },
  { name: 'Case Study', slug: 'case-study' },
  { name: 'Review Article', slug: 'review-article' },
  { name: 'Dissertation', slug: 'dissertation' },
  { name: 'Thesis', slug: 'thesis' }
];

const Step2Format = ({ selectedFormat, onSelect }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelect = (slug) => {
    onSelect(slug);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-extrabold text-slate-900">Select Publication Format</h2>
        <p className="text-xs text-slate-500 mt-1">Refine the format classification of your publication</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {FORMATS.map((format) => {
          const isSelected = selectedFormat === format.slug;
          return (
            <motion.button
              key={format.slug}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(format.slug)}
              className={`p-4 rounded-xl border text-center flex flex-col items-center justify-center min-h-[110px] transition-all ${
                isSelected
                  ? 'bg-blue-50 border-blue-600 shadow-md shadow-blue-600/5'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <FileText className={`w-5 h-5 mb-2 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
              <h3 className="text-xs font-bold text-slate-900">{format.name}</h3>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight text-center">{format.description}</p>
            </motion.button>
          );
        })}
      </div>

      <div className="text-center pt-2">
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors border border-blue-200 bg-blue-50/50 hover:bg-blue-50 px-4 py-2 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          <span>Add More Formats</span>
        </button>
      </div>

      {/* More Formats Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">Select Other Format</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-2 gap-3 max-h-[50vh]">
              {MORE_FORMATS.map((format) => {
                const isSelected = selectedFormat === format.slug;
                return (
                  <button
                    key={format.slug}
                    onClick={() => handleSelect(format.slug)}
                    className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {format.name}
                  </button>
                );
              })}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setModalOpen(false)}
                className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Step2Format;
