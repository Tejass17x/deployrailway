import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, ArrowRight, Save, Send, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import publicationService from '../../../services/publication.service';
import Step1Type from '../components/Step1Type';
import Step2Format from '../components/Step2Format';
import Step3Upload from '../components/Step3Upload';
import Step4Details from '../components/Step4Details';
import Step5Review from '../components/Step5Review';

const STEPS = [
  { label: 'Type', description: 'Select classification' },
  { label: 'Format', description: 'Select specific format' },
  { label: 'Upload File', description: 'Attach full text PDF' },
  { label: 'Details', description: 'Meta, Authors & Venue' },
  { label: 'Review', description: 'Preview & Confirm' }
];

const PublicationEditPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();

  // States
  const [step, setStep] = useState(4); // Default to Step 4 since we are editing existing details
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    subtitle: '',
    publicationType: '',
    researchType: 'Original Research',
    abstract: '',
    authorsList: [],
    publication: '',
    journal: '',
    conference: '',
    publisher: '',
    publicationDate: '',
    doi: '',
    isbn: '',
    issn: '',
    volume: '',
    issue: '',
    pages: '',
    language: 'English',
    researchAreas: [],
    keywords: [],
    visibility: 'Public',
    fileDetails: null,
    extractionConfidences: null
  });

  // Query to fetch publication
  const { data: pubRes, isLoading, error } = useQuery({
    queryKey: ['publication-edit', slug],
    queryFn: async () => {
      const res = await publicationService.getPublicationBySlug(slug);
      return res.success ? res.data : null;
    },
    enabled: !!slug
  });

  // Check user permission & hydrate form fields
  useEffect(() => {
    if (pubRes) {
      const pubUserId = pubRes.userId?._id || pubRes.userId?.id || pubRes.userId;
      const currentUserId = currentUser?._id || currentUser?.id;

      if (currentUser && pubUserId && pubUserId.toString() !== currentUserId?.toString() && currentUser.role !== 'admin') {
        toast.error('You are not authorized to edit this publication.');
        navigate(`/publication/${slug}`);
        return;
      }

      setFormData({
        id: pubRes._id || pubRes.id,
        title: pubRes.title || '',
        subtitle: pubRes.subtitle || '',
        publicationType: pubRes.publicationType || '',
        researchType: pubRes.researchType || 'Original Research',
        abstract: pubRes.abstract || '',
        authorsList: pubRes.authorsList || [],
        publication: pubRes.publication || pubRes.journal || '',
        journal: pubRes.journal || pubRes.publication || '',
        conference: pubRes.conference || '',
        publisher: pubRes.publisher || '',
        publicationDate: pubRes.publicationDate ? pubRes.publicationDate.split('T')[0] : '',
        doi: pubRes.doi || '',
        isbn: pubRes.isbn || '',
        issn: pubRes.issn || '',
        volume: pubRes.volume || '',
        issue: pubRes.issue || '',
        pages: pubRes.pages || '',
        language: pubRes.language || 'English',
        researchAreas: pubRes.researchAreasList || pubRes.researchAreas || [],
        keywords: pubRes.keywordsList || pubRes.keywords || [],
        visibility: pubRes.visibility || 'Public',
        fileDetails: pubRes.pdfUrl ? { secure_url: pubRes.pdfUrl, originalName: pubRes.title + '.pdf' } : null,
        extractionConfidences: null
      });
    }
  }, [pubRes, currentUser, navigate, slug]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTypeSelect = (typeSlug) => {
    handleFieldChange('publicationType', typeSlug);
    setStep(2);
  };

  const handleFormatSelect = (typeSlug) => {
    handleFieldChange('publicationType', typeSlug);
    setStep(3);
  };

  const handleUploadSuccess = ({ r2Data, extractedMetadata, originalName }) => {
    handleFieldChange('fileDetails', {
      ...r2Data,
      originalName
    });
    setStep(4);
  };

  const handleRemoveFile = () => {
    handleFieldChange('fileDetails', null);
  };

  const handleSkipUpload = () => {
    handleFieldChange('fileDetails', null);
    setStep(4);
  };

  const handleNext = () => {
    if (step === 4 && !formData.title.trim()) {
      toast.error('Publication title is required.');
      return;
    }
    setStep(prev => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const prepareSubmitData = (status) => {
    return {
      title: formData.title,
      subtitle: formData.subtitle,
      publicationType: formData.publicationType,
      researchType: formData.researchType,
      abstract: formData.abstract,
      authorsList: formData.authorsList,
      publication: formData.publication || formData.journal,
      journal: formData.journal || formData.publication,
      conference: formData.conference,
      publisher: formData.publisher,
      publicationDate: formData.publicationDate,
      doi: formData.doi,
      isbn: formData.isbn,
      issn: formData.issn,
      volume: formData.volume,
      issue: formData.issue,
      pages: formData.pages,
      language: formData.language,
      researchAreas: formData.researchAreas,
      keywords: formData.keywords,
      visibility: formData.visibility,
      status: status,
      // If full file details exist, pass pdfUrl
      pdfUrl: formData.fileDetails?.secure_url || null
    };
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    const loadingToast = toast.loading('Updating publication draft...');
    try {
      const submitData = prepareSubmitData('draft');
      const response = await publicationService.updatePublication(formData.id, submitData);
      
      if (response.success) {
        toast.success('Draft updated successfully!', { id: loadingToast });
        
        // Invalidate react-query cache keys
        queryClient.invalidateQueries({ queryKey: ['publications-portfolio'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        queryClient.invalidateQueries({ queryKey: ['publication', slug] });
        queryClient.invalidateQueries({ queryKey: ['publication-edit', slug] });

        navigate(`/profile/${currentUser.slug || currentUser.profileSlug || currentUser.username}/publications`);
      } else {
        toast.error(response.message || 'Failed to update draft.', { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error occurred while saving draft.', { id: loadingToast });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    const loadingToast = toast.loading('Publishing updated research...');
    try {
      const submitData = prepareSubmitData('published');
      const response = await publicationService.updatePublication(formData.id, submitData);
      
      if (response.success && response.data) {
        toast.success('Research updated and published successfully!', { id: loadingToast });
        
        // Invalidate react-query cache keys
        queryClient.invalidateQueries({ queryKey: ['publications-portfolio'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        queryClient.invalidateQueries({ queryKey: ['publication', slug] });
        queryClient.invalidateQueries({ queryKey: ['publication-edit', slug] });

        const targetSlug = response.data.slug;
        navigate(`/publication/${targetSlug}`);
      } else {
        toast.error(response.message || 'Failed to update research.', { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error occurred while updating.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !pubRes) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <p className="text-sm font-bold text-rose-600">Failed to load publication data.</p>
          <button onClick={() => navigate(-1)} className="text-xs bg-slate-200 px-4 py-2 rounded-xl">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Step Indicator / Stepper */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => {
              const currentIdx = idx + 1;
              const isActive = step === currentIdx;
              const isCompleted = step > currentIdx;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center relative last:flex-none">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border transition-all z-10 ${
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-4 ring-blue-100'
                        : isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white border-slate-200 text-slate-400'
                    }`}
                  >
                    {isCompleted ? '✓' : currentIdx}
                  </div>
                  
                  <span
                    className={`text-[10px] font-bold mt-1.5 hidden md:block ${
                      isActive ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>

                  {idx < STEPS.length - 1 && (
                    <div
                      className={`absolute top-3.5 left-[calc(50%+14px)] right-[calc(-50%+14px)] h-0.5 z-0 ${
                        step > currentIdx ? 'bg-emerald-500' : 'bg-slate-250'
                      }`}
                    ></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Step Render */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[350px] flex flex-col justify-between">
          <div className="flex-grow">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {step === 1 && (
                  <Step1Type
                    selectedType={formData.publicationType}
                    onSelect={handleTypeSelect}
                  />
                )}
                {step === 2 && (
                  <Step2Format
                    selectedFormat={formData.publicationType}
                    onSelect={handleFormatSelect}
                  />
                )}
                {step === 3 && (
                  <Step3Upload
                    fileDetails={formData.fileDetails}
                    onUploadSuccess={handleUploadSuccess}
                    onRemove={handleRemoveFile}
                    onSkip={handleSkipUpload}
                  />
                )}
                {step === 4 && (
                  <Step4Details
                    formData={formData}
                    onChange={handleFieldChange}
                    currentUser={currentUser}
                  />
                )}
                {step === 5 && (
                  <Step5Review
                    formData={formData}
                    fileDetails={formData.fileDetails}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stepper Footer Action Buttons */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-5 mt-6 gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors px-4 py-2.5 rounded-xl active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              {step > 3 && (
                <button
                  type="button"
                  disabled={isSavingDraft || isSubmitting}
                  onClick={handleSaveDraft}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                  {isSavingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Draft</span>
                </button>
              )}

              {step === 5 ? (
                <button
                  type="button"
                  disabled={isSubmitting || isSavingDraft}
                  onClick={handlePublish}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-755 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/10 disabled:opacity-50 active:scale-[0.98]"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Update Research</span>
                </button>
              ) : step === 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-755 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/10 active:scale-[0.98]"
                >
                  <span>Review Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PublicationEditPage;
