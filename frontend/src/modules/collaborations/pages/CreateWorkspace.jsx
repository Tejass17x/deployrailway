import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import collaborationsService from '../services/collaborations.service';

const RESEARCH_STAGES = ['Idea', 'Proposal', 'Ongoing', 'Completed'];
const FUNDING_STATUSES = ['Funded', 'Unfunded', 'Grant Pending'];
const VISIBILITIES = ['Private', 'Invite Only', 'Institution'];

export default function CreateWorkspace() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    title: '',
    description: '',
    researchArea: '',
    keywords: '',
    visibility: 'Private',
    institution: '',
    country: '',
    expectedDuration: '',
    startDate: '',
    endDate: '',
    researchStage: 'Idea',
    fundingStatus: 'Unfunded',
  });

  const mutation = useMutation({
    mutationFn: () => collaborationsService.createCollaboration({
      ...form,
      keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
    }),
    onSuccess: (res) => {
      toast.success('Workspace created!');
      navigate(`/collaborations/${res.data.data.slug}`);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create workspace.'),
  });

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className="min-h-screen bg-gray-950 text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Create Research Workspace
          </h1>
          <p className="text-gray-400 mt-2">Start a new collaborative research environment.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-6">
          {/* Name & Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Workspace Name *</label>
              <input
                name="name" value={form.name} onChange={handleChange}
                placeholder="AI in Healthcare Research"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Research Title</label>
              <input
                name="title" value={form.title} onChange={handleChange}
                placeholder="Deep Learning for Clinical Diagnostics"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Short Description</label>
            <textarea
              name="description" value={form.description} onChange={handleChange}
              rows={3} placeholder="Briefly describe your research goals..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none resize-none"
            />
          </div>

          {/* Research Area & Keywords */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Research Area</label>
              <input
                name="researchArea" value={form.researchArea} onChange={handleChange}
                placeholder="Machine Learning, Bioinformatics..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Keywords (comma-separated)</label>
              <input
                name="keywords" value={form.keywords} onChange={handleChange}
                placeholder="AI, healthcare, NLP"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Visibility, Stage, Funding */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'visibility', label: 'Visibility', options: VISIBILITIES },
              { name: 'researchStage', label: 'Research Stage', options: RESEARCH_STAGES },
              { name: 'fundingStatus', label: 'Funding Status', options: FUNDING_STATUSES },
            ].map(({ name, label, options }) => (
              <div key={name}>
                <label className="block text-sm text-gray-400 mb-1">{label}</label>
                <select
                  name={name} value={form[name]} onChange={handleChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none"
                >
                  {options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Institution & Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Institution</label>
              <input name="institution" value={form.institution} onChange={handleChange}
                placeholder="MIT, Stanford..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Country</label>
              <input name="country" value={form.country} onChange={handleChange}
                placeholder="United States"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Expected Duration</label>
              <input name="expectedDuration" value={form.expectedDuration} onChange={handleChange}
                placeholder="12 months"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Date</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">End Date</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate()}
              disabled={!form.name || mutation.isPending}
              className="flex-1 px-6 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {mutation.isPending ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
