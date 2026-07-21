import React, { useState, useEffect } from 'react';
import { Plus, Trash, User, Globe, Tag, FileText, Building2, HelpCircle, GripVertical } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Reorder } from 'framer-motion';

const Step4Details = ({ formData, onChange, currentUser }) => {
  const [newAuthor, setNewAuthor] = useState({
    name: '',
    email: '',
    institution: '',
    department: '',
    isCorresponding: false
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [areaInput, setAreaInput] = useState('');

  // Initializing default author list with current user if empty
  useEffect(() => {
    if (!formData.authorsList || formData.authorsList.length === 0) {
      const defaultAuthor = {
        name: currentUser?.fullName || 'Self',
        email: currentUser?.email || '',
        institution: currentUser?.institution || '',
        department: currentUser?.department || '',
        isCorresponding: true,
        authorId: currentUser?.userId || currentUser?._id || ''
      };
      onChange('authorsList', [defaultAuthor]);
    }
  }, [currentUser, formData.authorsList, onChange]);

  const handleInputChange = (field, value) => {
    onChange(field, value);
  };

  const getConfidenceBadge = (field) => {
    const confidence = formData.extractionConfidences?.[field];
    if (!confidence) return null;
    let color = 'bg-rose-50 text-rose-600 border-rose-100';
    if (confidence >= 85) color = 'bg-emerald-50 text-emerald-600 border-emerald-100';
    else if (confidence >= 60) color = 'bg-amber-50 text-amber-600 border-amber-100';
    
    return (
      <span className={`inline-flex items-center text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border ${color} ml-2`}>
        Auto-extracted ({confidence}%)
      </span>
    );
  };

  // Authors List Methods
  const addAuthor = () => {
    if (!newAuthor.name.trim()) {
      toast.error('Author name is required.');
      return;
    }
    const list = [...(formData.authorsList || [])];
    list.push({
      ...newAuthor,
      order: list.length
    });
    onChange('authorsList', list);
    setNewAuthor({
      name: '',
      email: '',
      institution: '',
      department: '',
      isCorresponding: false
    });
    toast.success('Author added successfully.');
  };

  const removeAuthor = (index) => {
    const list = [...(formData.authorsList || [])];
    list.splice(index, 1);
    // Re-index orders
    const reorderedList = list.map((author, idx) => ({ ...author, order: idx }));
    onChange('authorsList', reorderedList);
  };

  const moveAuthor = (index, direction) => {
    const list = [...(formData.authorsList || [])];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    const reorderedList = list.map((author, idx) => ({ ...author, order: idx }));
    onChange('authorsList', reorderedList);
  };

  const toggleCorresponding = (index) => {
    const list = (formData.authorsList || []).map((author, idx) => ({
      ...author,
      isCorresponding: idx === index
    }));
    onChange('authorsList', list);
    // Auto set corresponding author input field for compatibility
    if (list[index]) {
      onChange('correspondingAuthor', list[index].name);
    }
  };

  // Tags methods
  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    const kw = keywordInput.trim();
    const list = [...(formData.keywords || [])];
    if (!list.includes(kw)) {
      list.push(kw);
      onChange('keywords', list);
    }
    setKeywordInput('');
  };

  const removeKeyword = (index) => {
    const list = [...(formData.keywords || [])];
    list.splice(index, 1);
    onChange('keywords', list);
  };

  const addResearchArea = () => {
    if (!areaInput.trim()) return;
    const area = areaInput.trim();
    const list = [...(formData.researchAreas || [])];
    if (!list.includes(area)) {
      list.push(area);
      onChange('researchAreas', list);
    }
    setAreaInput('');
  };

  const removeResearchArea = (index) => {
    const list = [...(formData.researchAreas || [])];
    list.splice(index, 1);
    onChange('researchAreas', list);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto text-left text-slate-800">
      
      {/* 1. Core Metadata */}
      <section className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Core Metadata</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              <span>Title *</span>
              {getConfidenceBadge('title')}
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g. Attention Is All You Need"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={formData.subtitle || ''}
              onChange={(e) => handleInputChange('subtitle', e.target.value)}
              placeholder="e.g. Introducing Transformer-based architectures"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Publication Type</label>
            <input
              type="text"
              readOnly
              value={formData.publicationType || ''}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 font-semibold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Research Type</label>
            <select
              value={formData.researchType || ''}
              onChange={(e) => handleInputChange('researchType', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950 font-semibold bg-white"
            >
              <option value="">Select Research Type</option>
              <option value="Original Research">Original Research</option>
              <option value="Review Article">Review Article</option>
              <option value="Methodology">Methodology</option>
              <option value="Case Study">Case Study</option>
              <option value="Clinical Trial">Clinical Trial</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              <span>Abstract</span>
              {getConfidenceBadge('abstract')}
            </label>
            <textarea
              rows={5}
              value={formData.abstract || ''}
              onChange={(e) => handleInputChange('abstract', e.target.value)}
              placeholder="Provide a comprehensive summary or abstract of your research..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950"
            />
          </div>
        </div>
      </section>

      {/* 2. Authors Management */}
      <section className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <span>Authors & Order</span>
          {getConfidenceBadge('authors')}
        </h3>

        {/* Existing Authors List */}
        <Reorder.Group
          axis="y"
          values={formData.authorsList || []}
          onReorder={(newOrder) => {
            const reindexed = newOrder.map((author, idx) => ({ ...author, order: idx }));
            onChange('authorsList', reindexed);
          }}
          className="space-y-2"
        >
          {formData.authorsList?.map((author, index) => (
            <Reorder.Item
              key={author.name + '-' + author.email + '-' + index}
              value={author}
              className="flex items-center justify-between border border-slate-100 rounded-xl p-3 bg-slate-50/50 gap-2 text-xs cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <GripVertical className="w-4 h-4 text-slate-400 shrink-0 cursor-row-resize" />
                <span className="font-bold text-slate-400 shrink-0 w-4">#{index + 1}</span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{author.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {author.email || 'No email'} {author.institution ? `• ${author.institution}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleCorresponding(index)}
                  className={`px-2 py-1 rounded-md font-bold text-[10px] border transition-colors ${
                    author.isCorresponding
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                  title="Mark as Corresponding Author"
                >
                  Corresponding
                </button>
                <button
                  type="button"
                  onClick={() => removeAuthor(index)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-100"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {/* Add New Author Form */}
        <div className="border border-slate-200/80 rounded-2xl p-4 bg-slate-50/20 space-y-3">
          <p className="text-[11px] font-bold text-slate-700">Add Co-Author</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <input
              type="text"
              placeholder="Name *"
              value={newAuthor.name}
              onChange={(e) => setNewAuthor({ ...newAuthor, name: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none text-slate-900 bg-white"
            />
            <input
              type="email"
              placeholder="Email"
              value={newAuthor.email}
              onChange={(e) => setNewAuthor({ ...newAuthor, email: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none text-slate-900 bg-white"
            />
            <input
              type="text"
              placeholder="Institution"
              value={newAuthor.institution}
              onChange={(e) => setNewAuthor({ ...newAuthor, institution: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none text-slate-900 bg-white"
            />
            <input
              type="text"
              placeholder="Department"
              value={newAuthor.department}
              onChange={(e) => setNewAuthor({ ...newAuthor, department: e.target.value })}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none text-slate-900 bg-white"
            />
          </div>
          <div className="text-right">
            <button
              type="button"
              onClick={addAuthor}
              className="inline-flex items-center gap-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Author</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Venue & Identifiers */}
      <section className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>Publishing Venue & Identifiers</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              <span>Journal / Conference / Book Title</span>
              {getConfidenceBadge('journal')}
            </label>
            <input
              type="text"
              value={formData.publication || ''}
              onChange={(e) => handleInputChange('publication', e.target.value)}
              placeholder="e.g. Nature Communication"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Publication Date</label>
            <input
              type="date"
              value={formData.publicationDate || ''}
              onChange={(e) => handleInputChange('publicationDate', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Publisher</label>
            <input
              type="text"
              value={formData.publisher || ''}
              onChange={(e) => handleInputChange('publisher', e.target.value)}
              placeholder="e.g. Springer Nature"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              <span>DOI (Digital Object Identifier)</span>
              {getConfidenceBadge('doi')}
            </label>
            <input
              type="text"
              value={formData.doi || ''}
              onChange={(e) => handleInputChange('doi', e.target.value)}
              placeholder="e.g. 10.1038/nature123"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950 ${
                formData.doi && !/^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i.test(formData.doi.trim())
                  ? 'border-rose-450 focus:ring-rose-500'
                  : 'border-slate-200'
              }`}
            />
            {formData.doi && !/^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i.test(formData.doi.trim()) && (
              <p className="text-[10px] text-rose-500 mt-1 font-semibold">
                Invalid DOI format. Must start with 10. and follow standard structure.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Language</label>
            <input
              type="text"
              value={formData.language || ''}
              onChange={(e) => handleInputChange('language', e.target.value)}
              placeholder="e.g. English"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ISBN</label>
            <input
              type="text"
              value={formData.isbn || ''}
              onChange={(e) => handleInputChange('isbn', e.target.value)}
              placeholder="ISBN code"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ISSN</label>
            <input
              type="text"
              value={formData.issn || ''}
              onChange={(e) => handleInputChange('issn', e.target.value)}
              placeholder="ISSN code"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:col-span-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Vol</label>
              <input
                type="text"
                value={formData.volume || ''}
                onChange={(e) => handleInputChange('volume', e.target.value)}
                placeholder="Volume"
                className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-slate-950"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Issue</label>
              <input
                type="text"
                value={formData.issue || ''}
                onChange={(e) => handleInputChange('issue', e.target.value)}
                placeholder="Issue"
                className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-slate-950"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Pages</label>
              <input
                type="text"
                value={formData.pages || ''}
                onChange={(e) => handleInputChange('pages', e.target.value)}
                placeholder="Pages"
                className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none text-slate-950"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">License</label>
            <input
              type="text"
              value={formData.license || ''}
              onChange={(e) => handleInputChange('license', e.target.value)}
              placeholder="e.g. CC BY 4.0"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Funding Information</label>
            <input
              type="text"
              value={formData.funding || ''}
              onChange={(e) => handleInputChange('funding', e.target.value)}
              placeholder="e.g. NIH Grant #12345"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-950"
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!formData.openAccess}
                onChange={(e) => handleInputChange('openAccess', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-700">Open Access Publication</span>
            </label>
          </div>
        </div>
      </section>

      {/* 4. Research Area, Keywords & Visibility */}
      <section className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 space-y-5">
        <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-600" />
          <span>Taxonomies & Visibility</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Research Areas */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Research Areas</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Deep Learning"
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addResearchArea())}
                className="flex-grow px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none text-slate-950"
              />
              <button
                type="button"
                onClick={addResearchArea}
                className="bg-slate-100 text-slate-700 font-bold px-3.5 py-2 rounded-xl hover:bg-slate-200 transition-colors text-xs active:scale-[0.98]"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.researchAreas?.map((area, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 font-bold text-[10px] px-2.5 py-1 rounded-full">
                  <span>{area}</span>
                  <button type="button" onClick={() => removeResearchArea(idx)} className="hover:text-blue-800 text-blue-400">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              <span>Keywords</span>
              {getConfidenceBadge('keywords')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. NLP, Transformer"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                className="flex-grow px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none text-slate-950"
              />
              <button
                type="button"
                onClick={addKeyword}
                className="bg-slate-100 text-slate-700 font-bold px-3.5 py-2 rounded-xl hover:bg-slate-200 transition-colors text-xs active:scale-[0.98]"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {formData.keywords?.map((keyword, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 font-bold text-[10px] px-2.5 py-1 rounded-full">
                  <span>{keyword}</span>
                  <button type="button" onClick={() => removeKeyword(idx)} className="hover:text-slate-800 text-slate-400">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-bold text-slate-700">Publishing Visibility</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: 'Public', value: 'Public', desc: 'Anyone can view and download.' },
                { name: 'Institution Only', value: 'Institution Only', desc: 'Only members of your institution.' },
                { name: 'Private', value: 'Private', desc: 'Only you and co-authors.' }
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`border rounded-xl p-3 flex flex-col cursor-pointer transition-all ${
                    formData.visibility === opt.value
                      ? 'border-blue-600 bg-blue-50/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="visibility"
                      value={opt.value}
                      checked={formData.visibility === opt.value}
                      onChange={() => handleInputChange('visibility', opt.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-900">{opt.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 leading-normal">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Step4Details;
