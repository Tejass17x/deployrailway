import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, FileUp, Plus, Trash, Globe, Key, Shield, DollarSign, Calendar, Layers, Users, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import projectService from '../services/project.service';

const domains = [
  'Artificial Intelligence', 'Machine Learning', 'Healthcare', 'Blockchain', 'IoT',
  'Cybersecurity', 'Robotics', 'Cloud Computing', 'Bioinformatics', 'Computer Vision',
  'Natural Language Processing', 'Material Science', 'Quantum Computing', 'Other'
];

const projectTypes = [
  { value: 'open-source', label: 'Open Source', desc: 'Anyone can view and apply to join the workspace' },
  { value: 'private', label: 'Private', desc: 'Restricted access, visible only to approved members' },
  { value: 'institution-only', label: 'Institution Only', desc: 'Visible only to researchers in your organization' },
  { value: 'invitation-only', label: 'Invitation Only', desc: 'Hidden from search, access strictly via invite link' }
];

const fieldClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';
const Field = ({ label, children, className = '', required = false }) => (
  <label className={`block ${className}`}>
    <span className="mb-1.5 block text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-red-500">*</span>}
    </span>
    {children}
  </label>
);

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    longDescription: '',
    researchDomain: '',
    customDomain: '',
    status: 'draft',
    visibility: 'public',
    projectType: 'open-source',
    startDate: '',
    endDate: '',
    githubUrl: '',
    website: '',
    budget: 0,
    currency: 'USD',
    fundingSource: '',
    maxTeamMembers: 10,
    requiredSkills: '',
    eligibility: '',
    applicationDeadline: '',
    license: 'MIT',
    ethicsApproval: false,
    irbNumber: '',
    institution: '',
    department: '',
  });

  const [screeningQuestions, setScreeningQuestions] = useState([]);

  // Fetch the project detail to load into the form
  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project:edit', id],
    queryFn: async () => {
      const res = await projectService.getProject(id);
      return res.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (project) {
      const isCustomDomain = !domains.includes(project.researchDomain) && project.researchDomain;
      setForm({
        title: project.title || '',
        description: project.description || '',
        longDescription: project.longDescription || '',
        researchDomain: isCustomDomain ? 'Other' : (project.researchDomain || ''),
        customDomain: isCustomDomain ? project.researchDomain : '',
        status: project.status || 'draft',
        visibility: project.visibility || 'public',
        projectType: project.projectType || 'open-source',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        githubUrl: project.githubUrl || '',
        website: project.website || '',
        budget: project.budget || 0,
        currency: project.currency || 'USD',
        fundingSource: project.fundingSource || '',
        maxTeamMembers: project.maxTeamMembers || 10,
        requiredSkills: project.requiredSkills ? project.requiredSkills.join(', ') : '',
        eligibility: project.eligibility || '',
        applicationDeadline: project.applicationDeadline ? project.applicationDeadline.split('T')[0] : '',
        license: project.license || 'MIT',
        ethicsApproval: project.ethicsApproval || false,
        irbNumber: project.irbNumber || '',
        institution: project.institution || '',
        department: project.department || '',
      });
      if (project.screeningQuestions) {
        setScreeningQuestions(project.screeningQuestions);
      }
    }
  }, [project]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const addQuestion = () => {
    if (screeningQuestions.length >= 5) return toast.error('Maximum 5 screening questions allowed.');
    setScreeningQuestions((prev) => [...prev, { question: '', required: false, type: 'text' }]);
  };

  const removeQuestion = (index) => {
    setScreeningQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index, key, value) => {
    setScreeningQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [key]: value } : q))
    );
  };

  const nextStep = () => {
    if (step === 1) {
      if (!form.title.trim()) return toast.error('Project title is required.');
      if (!form.description.trim()) return toast.error('Short description is required.');
      if (!form.researchDomain) return toast.error('Research domain is required.');
    }
    if (step === 3) {
      if (form.maxTeamMembers < 1) return toast.error('Max team members must be at least 1.');
    }
    setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const skillsArray = form.requiredSkills
      ? form.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const payload = {
      ...form,
      requiredSkills: skillsArray,
      researchDomain: form.researchDomain === 'Other' ? form.customDomain.trim() : form.researchDomain,
      screeningQuestions: screeningQuestions.filter((q) => q.question.trim()),
    };
    delete payload.customDomain;

    try {
      await projectService.updateProject(id, payload);
      toast.success('Project details modified successfully');
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['project:workspace', id] });
      navigate(`/projects/${id}`);
    } catch (error) {
      toast.error(error.message || 'Could not update project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader className="animate-spin text-blue-650" size={32} />
        <p className="text-xs font-black text-slate-550">Loading project data...</p>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="max-w-xl mx-auto my-16 bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-sm">
        <h1 className="text-xl font-bold text-slate-800">Project Not Found</h1>
        <p className="text-xs text-slate-400 mt-2">The project you are looking to edit could not be loaded.</p>
        <button
          onClick={() => navigate('/projects')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-650 px-5 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition"
        >
          <ArrowLeft size={14} /> Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-16 font-sans">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition shadow-sm"
          aria-label="Go back"
        >
          <ArrowLeft size={19} />
        </button>
        <div>
          <p className="text-xs font-bold uppercase tracking-[.15em] text-blue-600">Research Connect</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Modify Project Details</h1>
          <p className="mt-1 text-sm text-slate-500">Edit your project metadata, recruitment profiles, references, and screening questions.</p>
        </div>
      </div>

      {/* Step Progress Bar */}
      <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          {[
            { step: 1, label: 'Metadata', icon: Layers },
            { step: 2, label: 'Institution', icon: Globe },
            { step: 3, label: 'Recruitment', icon: Users },
            { step: 4, label: 'References', icon: Shield },
            { step: 5, label: 'Screeners', icon: Key },
          ].map((item) => {
            const Icon = item.icon;
            const isCompleted = step > item.step;
            const isActive = step === item.step;
            return (
              <div key={item.step} className="flex flex-1 flex-col items-center relative">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 z-10 ${
                    isCompleted
                      ? 'bg-blue-600 text-white'
                      : isActive
                      ? 'bg-blue-50 border-2 border-blue-600 text-blue-600 shadow-md ring-4 ring-blue-500/10'
                      : 'bg-slate-50 border border-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                </div>
                <span className={`mt-2 text-xs font-bold ${isActive ? 'text-blue-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                  {item.label}
                </span>
                {item.step < 5 && (
                  <div
                    className={`absolute top-5 left-[50%] right-[-50%] h-[2px] -z-0 transition-all duration-300 ${
                      step > item.step ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Multi-step Form */}
      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-base font-bold text-slate-800">
            Step {step} of 5: {step === 1 ? 'Project Metadata & Info' : step === 2 ? 'Institution & Funding' : step === 3 ? 'Recruitment & Workspace Type' : step === 4 ? 'External Links & Legal' : 'Application Screening'}
          </h2>
        </div>

        <div className="p-6">
          {/* STEP 1: METADATA */}
          {step === 1 && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">Cover image <span className="font-normal text-slate-400">(optional)</span></span>
                <div className="flex min-h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer text-center p-6">
                  <FileUp className="mb-2 text-slate-400" size={24} />
                  <p className="text-sm font-bold text-slate-700">Drop an image here, or click to upload</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP up to 5MB</p>
                </div>
              </div>

              <Field label="Project title" required className="md:col-span-2">
                <input
                  required
                  value={form.title}
                  onChange={(e) => update('title', e.target.value)}
                  placeholder="Enter project title"
                  className={fieldClass}
                />
              </Field>

              <Field label="Short description" required className="md:col-span-2">
                <input
                  required
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Summarize the core focus in one simple sentence (max 500 chars)"
                  className={fieldClass}
                  maxLength={500}
                />
              </Field>

              <Field label="Detailed abstract" className="md:col-span-2">
                <textarea
                  value={form.longDescription}
                  onChange={(e) => update('longDescription', e.target.value)}
                  rows="5"
                  placeholder="Provide a comprehensive abstract outlining the research methodology, scope, and objectives..."
                  className={fieldClass}
                />
              </Field>

              <Field label="Research domain" required>
                <select
                  required
                  value={form.researchDomain}
                  onChange={(e) => update('researchDomain', e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Select a domain</option>
                  {domains.map((domain) => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </Field>

              <Field label="Project Status">
                <select
                  value={form.status}
                  onChange={(e) => update('status', e.target.value)}
                  className={fieldClass}
                >
                  <option value="draft">Draft (Private to owner)</option>
                  <option value="recruiting">Recruiting (Open to applications)</option>
                  <option value="active">Active (Work in progress)</option>
                </select>
              </Field>

              {form.researchDomain === 'Other' && (
                <Field label="Specify custom domain" required className="md:col-span-2">
                  <input
                    required
                    value={form.customDomain}
                    onChange={(e) => update('customDomain', e.target.value)}
                    placeholder="Enter your custom research domain"
                    className={fieldClass}
                  />
                </Field>
              )}
            </div>
          )}

          {/* STEP 2: INSTITUTION & FUNDING */}
          {step === 2 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Host Institution / University">
                <input
                  value={form.institution}
                  onChange={(e) => update('institution', e.target.value)}
                  placeholder="e.g. Stanford University"
                  className={fieldClass}
                />
              </Field>

              <Field label="Department / Lab">
                <input
                  value={form.department}
                  onChange={(e) => update('department', e.target.value)}
                  placeholder="e.g. Bioengineering Lab"
                  className={fieldClass}
                />
              </Field>

              <div className="border-t border-slate-100 md:col-span-2 my-2" />

              <Field label="Funding Source / Sponsor">
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={form.fundingSource}
                    onChange={(e) => update('fundingSource', e.target.value)}
                    placeholder="e.g. National Science Foundation"
                    className={`${fieldClass} pl-10`}
                  />
                </div>
              </Field>

              <Field label="Grant Budget (USD)">
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    min="0"
                    value={form.budget}
                    onChange={(e) => update('budget', Number(e.target.value))}
                    placeholder="0"
                    className={`${fieldClass} pl-10`}
                  />
                </div>
              </Field>

              <Field label="Start date">
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => update('startDate', e.target.value)}
                    className={`${fieldClass} pl-10`}
                  />
                </div>
              </Field>

              <Field label="Expected end date">
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => update('endDate', e.target.value)}
                    className={`${fieldClass} pl-10`}
                  />
                </div>
              </Field>
            </div>
          )}

          {/* STEP 3: RECRUITMENT & WORKSPACE TYPE */}
          {step === 3 && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Project visibility & Access</label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {projectTypes.map((type) => (
                    <div
                      key={type.value}
                      onClick={() => update('projectType', type.value)}
                      className={`border rounded-xl p-4 cursor-pointer transition hover:bg-slate-50 ${
                        form.projectType === type.value
                          ? 'border-blue-650 bg-blue-50/20 shadow-sm ring-2 ring-blue-600/5'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-905">{type.label}</span>
                        <input
                          type="radio"
                          name="projectType"
                          value={type.value}
                          checked={form.projectType === type.value}
                          onChange={() => {}}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 font-semibold mt-1 leading-relaxed">{type.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Field label="Max team members">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={form.maxTeamMembers}
                  onChange={(e) => update('maxTeamMembers', Number(e.target.value))}
                  className={fieldClass}
                />
              </Field>

              <Field label="Application deadline">
                <input
                  type="date"
                  value={form.applicationDeadline}
                  onChange={(e) => update('applicationDeadline', e.target.value)}
                  className={fieldClass}
                />
              </Field>

              <Field label="Required skills (Comma-separated)" className="md:col-span-2">
                <input
                  value={form.requiredSkills}
                  onChange={(e) => update('requiredSkills', e.target.value)}
                  placeholder="e.g. Python, PyTorch, Data Analysis, LaTeX"
                  className={fieldClass}
                />
              </Field>

              <Field label="Eligibility / Experience needed" className="md:col-span-2">
                <textarea
                  value={form.eligibility}
                  onChange={(e) => update('eligibility', e.target.value)}
                  rows="3"
                  placeholder="e.g. PhD scholars or Master's students in Computer Science. Prior publication experience is preferred."
                  className={fieldClass}
                />
              </Field>
            </div>
          )}

          {/* STEP 4: REFERENCES & LEGAL */}
          {step === 4 && (
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="GitHub repository URL" className="md:col-span-2">
                <input
                  type="url"
                  value={form.githubUrl}
                  onChange={(e) => update('githubUrl', e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className={fieldClass}
                />
              </Field>

              <Field label="Project website / Homepage" className="md:col-span-2">
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => update('website', e.target.value)}
                  placeholder="https://project-website.org"
                  className={fieldClass}
                />
              </Field>

              <Field label="License / IP Terms">
                <select
                  value={form.license}
                  onChange={(e) => update('license', e.target.value)}
                  className={fieldClass}
                >
                  <option value="MIT">MIT License</option>
                  <option value="Apache-2.0">Apache 2.0</option>
                  <option value="GPL-3.0">GNU GPL v3</option>
                  <option value="CC-BY-4.0">Creative Commons BY 4.0</option>
                  <option value="Proprietary">Proprietary / Closed Source</option>
                </select>
              </Field>

              <div className="flex items-center gap-3 pt-8 pl-2">
                <input
                  type="checkbox"
                  id="ethicsApproval"
                  checked={form.ethicsApproval}
                  onChange={(e) => update('ethicsApproval', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="ethicsApproval" className="text-sm font-bold text-slate-700 cursor-pointer">
                  Has Ethics Board / IRB Approval
                </label>
              </div>

              {form.ethicsApproval && (
                <Field label="IRB / Ethics Approval Reference Number" className="md:col-span-2 animate-fadeIn">
                  <input
                    value={form.irbNumber}
                    onChange={(e) => update('irbNumber', e.target.value)}
                    placeholder="e.g. IRB-2026-X830"
                    className={fieldClass}
                  />
                </Field>
              )}
            </div>
          )}

          {/* STEP 5: SCREENING QUESTIONS */}
          {step === 5 && (
            <div className="space-y-5">
              <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-4">
                <h3 className="font-bold text-sm text-blue-900 mb-1">Add Screening Questions</h3>
                <p className="text-xs text-blue-750 font-semibold leading-relaxed">
                  Applicants will be required to answer these questions when they request to join your project. This helps screen qualified collaborators.
                </p>
              </div>

              <div className="space-y-4">
                {screeningQuestions.map((q, idx) => (
                  <div key={idx} className="flex items-start gap-3 border border-slate-100 rounded-xl p-4 bg-white shadow-sm">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-400">QUESTION {idx + 1}</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={q.required}
                              onChange={(e) => updateQuestion(idx, 'required', e.target.checked)}
                              className="rounded text-blue-600 w-3.5 h-3.5"
                            />
                            Required
                          </label>
                          <select
                            value={q.type}
                            onChange={(e) => updateQuestion(idx, 'type', e.target.value)}
                            className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-0.5"
                          >
                            <option value="text">Short Answer</option>
                            <option value="textarea">Paragraph Answer</option>
                            <option value="yesno">Yes/No Question</option>
                          </select>
                        </div>
                      </div>
                      <input
                        required
                        value={q.question}
                        onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                        placeholder="e.g. What specific tools or libraries do you have experience with?"
                        className={fieldClass}
                      />
                    </div>
                    {screeningQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500 transition mt-6"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addQuestion}
                disabled={screeningQuestions.length >= 5}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <Plus size={14} /> Add Question
              </button>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="flex justify-between items-center bg-slate-50 px-6 py-4 border-t border-slate-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-650 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition"
            >
              Next <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-650 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? 'Modifying Workspace...' : 'Save Changes'} <Check size={16} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
