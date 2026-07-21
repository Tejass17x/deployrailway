import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus, Trash2, Award, ShieldCheck, FileText, BookOpen, BarChart2 } from 'lucide-react';
import Input from '../../../components/common/inputs/Input';
import Button from '../../../components/common/buttons/Button';

const EditProfileModal = ({ isOpen, onClose, profile, user, onSave, loading }) => {
  const [activeTab, setActiveTab] = useState('general');
  
  // URL Default Fallbacks (Pure White Cover and Default Guest)
  const defaultAvatarUrl = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png';
  const defaultWhiteCoverUrl = 'https://dummyimage.com/1200x400/ffffff/ffffff.png'; 

  // Local Form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    displayName: profile?.displayName || '',
    headline: profile?.headline || '',
    bio: profile?.bio || '',
    coverImage: profile?.coverImage || '',
    profileImage: profile?.profileImage || '',
    dateOfBirth: profile?.dateOfBirth || '',
    nationality: profile?.nationality || '',
    country: profile?.country || '',
    state: profile?.state || '',
    city: profile?.city || '',
    institution: profile?.institution || '',
    department: profile?.department || '',
    designation: profile?.designation || '',
    organization: profile?.organization || '',
    researchGroup: profile?.researchGroup || '',
    availability: profile?.availability || '',
    openToCollaborate: !!profile?.openToCollaborate,
    openToMentor: !!profile?.openToMentor,
    openToResearch: !!profile?.openToResearch,
    emailVisibility: profile?.emailVisibility || 'private',
    education: profile?.education || [],
    experience: profile?.experience || [],
    projects: profile?.projects || [],
    skills: profile?.skills || [],
    patents: profile?.patents || [],
    books: profile?.books || [],
    awards: profile?.awards || profile?.achievements || [],
    certificates: profile?.certificates || profile?.certifications || [],
    metrics: {
      publicationsCount: profile?.metrics?.publicationsCount || 0,
      citationsCount: profile?.metrics?.citationsCount || profile?.metrics?.totalCitations || 0,
      hIndex: profile?.metrics?.hIndex || 0,
      i10Index: profile?.metrics?.i10Index || 0,
      patentsCount: profile?.metrics?.patentsCount || 0,
      booksCount: profile?.metrics?.booksCount || 0,
      datasetsCount: profile?.metrics?.datasetsCount || 0,
      downloadsCount: profile?.metrics?.downloadsCount || 0,
      viewsCount: profile?.metrics?.viewsCount || 0
    }
  });

  const getValue = (val) => {
    if (val && typeof val === 'object' && val.target !== undefined) return val.target.value;
    return val;
  };

  const handleTextChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: getValue(value) }));
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: getValue(value) }));
  };

  const handleMetricChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      metrics: { ...prev.metrics, [field]: Number(getValue(value)) }
    }));
  };

  const addListItem = (field, defaultValue) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], defaultValue] }));
  };

  const removeListItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const updateListItem = (field, index, key, value) => {
    setFormData(prev => {
      const updatedList = [...prev[field]];
      updatedList[index] = { ...updatedList[index], [key]: value };
      return { ...prev, [field]: updatedList };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...formData };
    payload.education = payload.education.filter(e => e.degree && e.university && e.duration);
    payload.experience = payload.experience.filter(e => e.designation && e.institution && e.duration);
    payload.projects = payload.projects.filter(p => p.title);
    payload.skills = payload.skills.filter(s => s.name);
    payload.awards = payload.awards.filter(a => a.title && a.organization);
    payload.certificates = payload.certificates.filter(c => c.name && c.organization);

    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-border"
        >
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">Edit Researcher Profile</h3>
              <p className="text-[10px] text-text-secondary font-medium">Update your credentials, timelines, portfolios, and metrics overrides.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-bg-page border border-border rounded-xl text-text-secondary hover:text-text-primary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-shrink-0 border-b border-border bg-bg-page/20 px-6 py-2 gap-2 overflow-x-auto overflow-y-hidden scrollbar-none">
            {[
              { id: 'general', label: 'General & Bio' },
              { id: 'education', label: 'Academic & Jobs' },
              { id: 'projects', label: 'Projects & Skills' },
              { id: 'output', label: 'Academic Output' },
              { id: 'metrics', label: 'Research Metrics' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all capitalize whitespace-nowrap ${
                  activeTab === tab.id ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-bg-page'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <Input label="First Name" value={formData.firstName} onChange={val => handleTextChange('firstName', val)} required />
                <Input label="Last Name" value={formData.lastName} onChange={val => handleTextChange('lastName', val)} required />
                <Input label="Display Name" value={formData.displayName} onChange={val => handleTextChange('displayName', val)} placeholder="How your name appears on your profile" />
                <Input label="Headline" value={formData.headline} onChange={val => handleTextChange('headline', val)} placeholder="e.g. AI Researcher | NLP & LLM Enthusiast" />
                <Input label="Designation / Position" value={formData.designation} onChange={val => handleTextChange('designation', val)} />
                <Input label="Institution" value={formData.institution} onChange={val => handleTextChange('institution', val)} />
                <Input label="Department" value={formData.department} onChange={val => handleTextChange('department', val)} />
                <Input label="Research Group / Lab" value={formData.researchGroup} onChange={val => handleTextChange('researchGroup', val)} placeholder="e.g. Stanford AI Lab" />
                <Input label="Organization" value={formData.organization} onChange={val => handleTextChange('organization', val)} />
                <Input label="Country" value={formData.country} onChange={val => handleTextChange('country', val)} />
                <Input label="State" value={formData.state} onChange={val => handleTextChange('state', val)} />
                <Input label="City" value={formData.city} onChange={val => handleTextChange('city', val)} />
                <Input label="Date of Birth" value={formData.dateOfBirth} onChange={val => handleTextChange('dateOfBirth', val)} type="date" />
                <Input label="Nationality" value={formData.nationality} onChange={val => handleTextChange('nationality', val)} placeholder="e.g. Indian" />
                <Input label="Availability / Status" value={formData.availability} onChange={val => handleTextChange('availability', val)} placeholder="e.g. Open for PhD positions starting Fall 2026" />
                
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-text-secondary uppercase">Email Visibility</label>
                  <select 
                    value={formData.emailVisibility} 
                    onChange={e => handleTextChange('emailVisibility', e.target.value)} 
                    className="w-full text-xs p-3 border border-border rounded-xl focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="public">Publicly Visible</option>
                    <option value="connections">Connections Only</option>
                    <option value="private">Private (Only Me)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <label className="text-[11px] font-bold text-text-secondary uppercase">Collaboration Badges</label>
                  <div className="flex flex-wrap gap-4 mt-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-text-primary cursor-pointer">
                      <input type="checkbox" checked={formData.openToCollaborate} onChange={e => handleCheckboxChange('openToCollaborate', e.target.checked)} className="rounded text-primary focus:ring-primary" />
                      Open to Collaborate
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-text-primary cursor-pointer">
                      <input type="checkbox" checked={formData.openToMentor} onChange={e => handleCheckboxChange('openToMentor', e.target.checked)} className="rounded text-primary focus:ring-primary" />
                      Open to Mentor
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-text-primary cursor-pointer">
                      <input type="checkbox" checked={formData.openToResearch} onChange={e => handleCheckboxChange('openToResearch', e.target.checked)} className="rounded text-primary focus:ring-primary" />
                      Open to Joint Research
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1 mb-4">
                  <label className="text-[11px] font-bold text-text-secondary uppercase">Short Bio (max 500 characters)</label>
                  <textarea rows={2} value={formData.bio} onChange={e => handleTextChange('bio', e.target.value)} className="w-full text-xs p-3 border border-border rounded-xl focus:outline-none focus:border-primary bg-bg-page/10" maxLength={500} />
                </div>

                {/* --- MINIMALIST IMAGES ROW SECTION (MOVED TO VERY BOTTOM) --- */}
                <div className="md:col-span-2 space-y-3 pt-6 mt-2 border-t border-slate-200">
                  <label className="text-[11px] font-black text-primary uppercase tracking-wider block mb-2">Profile & Cover Images</label>
                  
                  {/* Profile Pic Row */}
                  <div className="flex items-center justify-between bg-slate-50 border border-border p-2 rounded-xl shadow-sm">
                    <span className="text-[11px] font-bold text-slate-700 uppercase w-1/4 pl-2 shrink-0">Profile Pic URL</span>
                    <input 
                      type="text" 
                      value={formData.profileImage} 
                      onChange={e => handleTextChange('profileImage', e.target.value)} 
                      className="flex-grow text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary px-3 py-2 text-text-primary"
                      placeholder="Paste Profile Image URL"
                    />
                    <button 
                      type="button" 
                      onClick={() => handleTextChange('profileImage', defaultAvatarUrl)} 
                      className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors ml-3 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>

                  {/* Cover Pic Row */}
                  <div className="flex items-center justify-between bg-slate-50 border border-border p-2 rounded-xl shadow-sm">
                    <span className="text-[11px] font-bold text-slate-700 uppercase w-1/4 pl-2 shrink-0">Cover Pic URL</span>
                    <input 
                      type="text" 
                      value={formData.coverImage} 
                      onChange={e => handleTextChange('coverImage', e.target.value)} 
                      className="flex-grow text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary px-3 py-2 text-text-primary"
                      placeholder="Paste Cover Image URL"
                    />
                    <button 
                      type="button" 
                      onClick={() => handleTextChange('coverImage', defaultWhiteCoverUrl)} 
                      className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors ml-3 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
                {/* --- END MINIMALIST IMAGES SECTION --- */}

              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="text-xs font-bold text-primary uppercase">Education Timeline</h4>
                    <button type="button" onClick={() => addListItem('education', { degree: '', university: '', duration: '', cgpa: '', specialization: '', description: '' })} className="flex items-center gap-1 text-[10px] bg-primary/5 text-primary border border-primary/10 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Education
                    </button>
                  </div>
                  {formData.education.map((edu, idx) => (
                    <div key={idx} className="p-4 border border-border bg-bg-page/10 rounded-2xl relative space-y-3">
                      <button type="button" onClick={() => removeListItem('education', idx)} className="absolute right-4 top-4 p-1.5 hover:bg-red-50 text-accent-red rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-8">
                        <input type="text" placeholder="Degree (e.g. PhD)" value={edu.degree} onChange={e => updateListItem('education', idx, 'degree', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" required />
                        <input type="text" placeholder="University" value={edu.university} onChange={e => updateListItem('education', idx, 'university', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" required />
                        <input type="text" placeholder="Duration (e.g. 2018 - 2022)" value={edu.duration} onChange={e => updateListItem('education', idx, 'duration', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" required />
                        <input type="text" placeholder="CGPA/Grade (Optional)" value={edu.cgpa} onChange={e => updateListItem('education', idx, 'cgpa', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" />
                        <input type="text" placeholder="Specialization (Optional)" value={edu.specialization} onChange={e => updateListItem('education', idx, 'specialization', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white sm:col-span-2" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="text-xs font-bold text-primary uppercase">Work Experience</h4>
                    <button type="button" onClick={() => addListItem('experience', { designation: '', institution: '', duration: '', description: '', researchFocus: '' })} className="flex items-center gap-1 text-[10px] bg-primary/5 text-primary border border-primary/10 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Experience
                    </button>
                  </div>
                  {formData.experience.map((exp, idx) => (
                    <div key={idx} className="p-4 border border-border bg-bg-page/10 rounded-2xl relative space-y-3">
                      <button type="button" onClick={() => removeListItem('experience', idx)} className="absolute right-4 top-4 p-1.5 hover:bg-red-50 text-accent-red rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-8">
                        <input type="text" placeholder="Designation" value={exp.designation} onChange={e => updateListItem('experience', idx, 'designation', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" required />
                        <input type="text" placeholder="Institution / Company" value={exp.institution} onChange={e => updateListItem('experience', idx, 'institution', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" required />
                        <input type="text" placeholder="Duration (e.g. 2022 - Present)" value={exp.duration} onChange={e => updateListItem('experience', idx, 'duration', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" required />
                        <input type="text" placeholder="Research Focus / Specialization" value={exp.researchFocus} onChange={e => updateListItem('experience', idx, 'researchFocus', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white sm:col-span-3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="text-xs font-bold text-primary uppercase">Research Projects</h4>
                    <button type="button" onClick={() => addListItem('projects', { title: '', description: '', technology: '', duration: '', status: 'Ongoing', collaborators: '' })} className="flex items-center gap-1 text-[10px] bg-primary/5 text-primary border border-primary/10 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Project
                    </button>
                  </div>
                  {formData.projects.map((proj, idx) => (
                    <div key={idx} className="p-4 border border-border bg-bg-page/10 rounded-2xl relative space-y-3">
                      <button type="button" onClick={() => removeListItem('projects', idx)} className="absolute right-4 top-4 p-1.5 hover:bg-red-50 text-accent-red rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                        <input type="text" placeholder="Project Title" value={proj.title} onChange={e => updateListItem('projects', idx, 'title', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white sm:col-span-2" required />
                        <input type="text" placeholder="Stack/Technology (e.g. PyTorch, NLP)" value={proj.technology} onChange={e => updateListItem('projects', idx, 'technology', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" />
                        <input type="text" placeholder="Duration (e.g. Jan 2024 - Present)" value={proj.duration} onChange={e => updateListItem('projects', idx, 'duration', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" />
                        <select value={proj.status} onChange={e => updateListItem('projects', idx, 'status', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white">
                          <option value="Ongoing">Ongoing</option>
                          <option value="Completed">Completed</option>
                          <option value="Proposed">Proposed</option>
                        </select>
                        <input type="text" placeholder="Collaborators names" value={proj.collaborators} onChange={e => updateListItem('projects', idx, 'collaborators', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" />
                        <textarea placeholder="Project Description" value={proj.description} onChange={e => updateListItem('projects', idx, 'description', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white sm:col-span-2" rows={2} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="text-xs font-bold text-primary uppercase">Expertise & Skills</h4>
                    <button type="button" onClick={() => addListItem('skills', { name: '', category: 'Other' })} className="flex items-center gap-1 text-[10px] bg-primary/5 text-primary border border-primary/10 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Skill
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.skills.map((skill, idx) => (
                      <div key={idx} className="flex items-center gap-2 border border-border p-2 rounded-xl bg-white shadow-sm">
                        <input type="text" placeholder="Skill Name" value={skill.name} onChange={e => updateListItem('skills', idx, 'name', e.target.value)} className="text-xs p-1.5 border-none focus:outline-none bg-transparent flex-grow" required />
                        <select value={skill.category} onChange={e => updateListItem('skills', idx, 'category', e.target.value)} className="text-xs p-1 border border-border rounded-lg bg-bg-page focus:outline-none">
                          {['Programming', 'AI', 'ML', 'Cloud', 'Research', 'Writing', 'Statistics', 'Other'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <button type="button" onClick={() => removeListItem('skills', idx)} className="p-1 hover:bg-red-50 text-accent-red rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'output' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="text-xs font-bold text-primary uppercase flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Patents Portfolio
                    </h4>
                    <button type="button" onClick={() => addListItem('patents', { title: '', patentNumber: '', inventors: '', issueDate: '', description: '', url: '' })} className="flex items-center gap-1 text-[10px] bg-primary/5 text-primary border border-primary/10 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Patent
                    </button>
                  </div>
                  {formData.patents.map((pat, idx) => (
                    <div key={idx} className="p-4 border border-border bg-bg-page/10 rounded-2xl relative space-y-3">
                      <button type="button" onClick={() => removeListItem('patents', idx)} className="absolute right-4 top-4 p-1.5 hover:bg-red-50 text-accent-red rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-8">
                        <input type="text" placeholder="Patent Title" value={pat.title} onChange={e => updateListItem('patents', idx, 'title', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white sm:col-span-2" required />
                        <input type="text" placeholder="Patent Number" value={pat.patentNumber} onChange={e => updateListItem('patents', idx, 'patentNumber', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" />
                        <input type="text" placeholder="Inventors (comma separated)" value={pat.inventors} onChange={e => updateListItem('patents', idx, 'inventors', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" />
                        <input type="text" placeholder="Issue Date (e.g. 2024-03)" value={pat.issueDate} onChange={e => updateListItem('patents', idx, 'issueDate', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" />
                        <input type="text" placeholder="Patent Link/URL" value={pat.url} onChange={e => updateListItem('patents', idx, 'url', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" />
                        <textarea placeholder="Description" value={pat.description} onChange={e => updateListItem('patents', idx, 'description', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white sm:col-span-3" rows={2} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="text-xs font-bold text-primary uppercase flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" /> Published Books
                    </h4>
                    <button type="button" onClick={() => addListItem('books', { title: '', authors: '', publisher: '', year: new Date().getFullYear(), isbn: '', description: '', url: '' })} className="flex items-center gap-1 text-[10px] bg-primary/5 text-primary border border-primary/10 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Book
                    </button>
                  </div>
                  {formData.books.map((bk, idx) => (
                    <div key={idx} className="p-4 border border-border bg-bg-page/10 rounded-2xl relative space-y-3">
                      <button type="button" onClick={() => removeListItem('books', idx)} className="absolute right-4 top-4 p-1.5 hover:bg-red-50 text-accent-red rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-8">
                        <input type="text" placeholder="Book Title" value={bk.title} onChange={e => updateListItem('books', idx, 'title', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white sm:col-span-2" required />
                        <input type="text" placeholder="Authors (comma separated)" value={bk.authors} onChange={e => updateListItem('books', idx, 'authors', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" />
                        <input type="text" placeholder="Publisher" value={bk.publisher} onChange={e => updateListItem('books', idx, 'publisher', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" />
                        <input type="number" placeholder="Year" value={bk.year} onChange={e => updateListItem('books', idx, 'year', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" />
                        <input type="text" placeholder="ISBN Code" value={bk.isbn} onChange={e => updateListItem('books', idx, 'isbn', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" />
                        <input type="text" placeholder="Publisher Link" value={bk.url} onChange={e => updateListItem('books', idx, 'url', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white sm:col-span-3" />
                        <textarea placeholder="Summary Description" value={bk.description} onChange={e => updateListItem('books', idx, 'description', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white sm:col-span-3" rows={2} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="text-xs font-bold text-primary uppercase flex items-center gap-1.5">
                      <Award className="w-4 h-4" /> Awards & Achievements
                    </h4>
                    <button type="button" onClick={() => addListItem('awards', { title: '', organization: '', year: new Date().getFullYear(), description: '' })} className="flex items-center gap-1 text-[10px] bg-primary/5 text-primary border border-primary/10 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Award
                    </button>
                  </div>
                  {formData.awards.map((aw, idx) => (
                    <div key={idx} className="p-4 border border-border bg-bg-page/10 rounded-2xl relative space-y-3">
                      <button type="button" onClick={() => removeListItem('awards', idx)} className="absolute right-4 top-4 p-1.5 hover:bg-red-50 text-accent-red rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-8">
                        <input type="text" placeholder="Award Title (e.g. Best Paper Award)" value={aw.title} onChange={e => updateListItem('awards', idx, 'title', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white sm:col-span-2" required />
                        <input type="text" placeholder="Granting Organization" value={aw.organization} onChange={e => updateListItem('awards', idx, 'organization', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" required />
                        <input type="number" placeholder="Year" value={aw.year} onChange={e => updateListItem('awards', idx, 'year', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" required />
                        <textarea placeholder="Description" value={aw.description} onChange={e => updateListItem('awards', idx, 'description', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white sm:col-span-3" rows={2} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="text-xs font-bold text-primary uppercase flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Certificates
                    </h4>
                    <button type="button" onClick={() => addListItem('certificates', { name: '', organization: '', issueDate: '', credentialUrl: '' })} className="flex items-center gap-1 text-[10px] bg-primary/5 text-primary border border-primary/10 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Certificate
                    </button>
                  </div>
                  {formData.certificates.map((cert, idx) => (
                    <div key={idx} className="p-4 border border-border bg-bg-page/10 rounded-2xl relative space-y-3">
                      <button type="button" onClick={() => removeListItem('certificates', idx)} className="absolute right-4 top-4 p-1.5 hover:bg-red-50 text-accent-red rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                        <input type="text" placeholder="Certificate Name" value={cert.name} onChange={e => updateListItem('certificates', idx, 'name', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" required />
                        <input type="text" placeholder="Issuing Institution/Organization" value={cert.organization} onChange={e => updateListItem('certificates', idx, 'organization', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" required />
                        <input type="text" placeholder="Issue Date (e.g. 2023-08)" value={cert.issueDate} onChange={e => updateListItem('certificates', idx, 'issueDate', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" />
                        <input type="text" placeholder="Credential Verification Link/URL" value={cert.credentialUrl} onChange={e => updateListItem('certificates', idx, 'credentialUrl', e.target.value)} className="text-xs p-2 border border-border rounded-xl focus:outline-none bg-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2">
                  <BarChart2 className="w-5 h-5 text-primary" />
                  <h4 className="text-xs font-bold text-primary uppercase">Research Metrics Manual Override</h4>
                </div>
                <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                  Note: Values synced from Google Scholar act as your initial base. You can manually adjust these counts if you have additional verified publications, patents, or citations outside Google Scholar.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <Input type="number" label="Publications Count" value={formData.metrics.publicationsCount} onChange={val => handleMetricChange('publicationsCount', val)} />
                  <Input type="number" label="Citations Count" value={formData.metrics.citationsCount} onChange={val => handleMetricChange('citationsCount', val)} />
                  <Input type="number" label="h-Index" value={formData.metrics.hIndex} onChange={val => handleMetricChange('hIndex', val)} />
                  <Input type="number" label="i10-Index" value={formData.metrics.i10Index} onChange={val => handleMetricChange('i10Index', val)} />
                  <Input type="number" label="Patents Count" value={formData.metrics.patentsCount} onChange={val => handleMetricChange('patentsCount', val)} />
                  <Input type="number" label="Books Count" value={formData.metrics.booksCount} onChange={val => handleMetricChange('booksCount', val)} />
                  <Input type="number" label="Datasets Count" value={formData.metrics.datasetsCount} onChange={val => handleMetricChange('datasetsCount', val)} />
                  <Input type="number" label="Downloads Count" value={formData.metrics.downloadsCount} onChange={val => handleMetricChange('downloadsCount', val)} />
                  <Input type="number" label="Views Override" value={formData.metrics.viewsCount} onChange={val => handleMetricChange('viewsCount', val)} />
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-border flex justify-end gap-3 bg-bg-page/20">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="primary" loading={loading} onClick={handleSubmit} icon={<Save className="w-4 h-4" />}>
              Save Profile Changes
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditProfileModal;