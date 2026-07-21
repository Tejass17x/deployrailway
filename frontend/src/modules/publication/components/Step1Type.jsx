import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Award, Compass, ShieldCheck, Plus, X } from 'lucide-react';

const PUB_TYPES = [
  { name: 'Publish Research', slug: 'article', icon: FileText, description: 'Publish a journal article, review, or letter.' },
  { name: 'Conference Paper', slug: 'conference-paper', icon: Award, description: 'Paper presented at a conference or proceeding.' },
  { name: 'Preprint', slug: 'preprint', icon: Compass, description: 'Draft of paper shared before formal peer review.' },
  { name: 'Patent', slug: 'patent', icon: ShieldCheck, description: 'Official patent publication or design application.' }
];

const MORE_PUB_TYPES = [
  { name: 'Presentation', slug: 'presentation' },
  { name: 'Poster', slug: 'poster' },
  { name: 'Dataset', slug: 'dataset' },
  { name: 'Method', slug: 'method' },
  { name: 'Proposal', slug: 'proposal' },
  { name: 'Technical Report', slug: 'technical-report' },
  { name: 'Book', slug: 'book' },
  { name: 'Book Chapter', slug: 'book-chapter' },
  { name: 'Thesis', slug: 'thesis' },
  { name: 'White Paper', slug: 'white-paper' }
];

const Step1Type = ({ selectedType, onSelect }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const handleSelect = (slug) => {
    onSelect(slug);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-extrabold text-slate-900">Add your Research</h2>
        <p className="text-xs text-slate-500 mt-1">Share your research with the global research community.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {PUB_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.slug;
          return (
            <motion.button
              key={type.slug}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(type.slug)}
              className={`p-5 rounded-2xl border text-left flex items-start gap-4 transition-all ${
                isSelected
                  ? 'bg-blue-50 border-blue-600 shadow-md shadow-blue-600/5'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <span className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'
              }`}>
                <Icon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{type.name}</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">{type.description}</p>
              </div>
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
          <span>Add More Types</span>
        </button>
      </div>

      {/* More Types Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">Select Other Publication Type</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-2 gap-3 max-h-[50vh]">
              {MORE_PUB_TYPES.map((type) => {
                const isSelected = selectedType === type.slug;
                return (
                  <button
                    key={type.slug}
                    onClick={() => handleSelect(type.slug)}
                    className={`p-3.5 rounded-xl border text-center font-bold text-xs transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {type.name}
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

export default Step1Type;
