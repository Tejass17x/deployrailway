import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Save, Send, Loader2 } from 'lucide-react';

import publicationService from '../../../services/publication.service';
import Step1Type from '../components/Step1Type';
import Step2Format from '../components/Step2Format';
import Step3Upload from '../components/Step3Upload';
import Step4Details from '../components/Step4Details';
import Step5Review from '../components/Step5Review';

const STEPS = [
  { label: 'Type', description: 'Publication Category' },
  { label: 'Format', description: 'Sub-format Details' },
  { label: 'Upload', description: 'Attach Full Text' },
  { label: 'Metadata', description: 'Publication Details' },
  { label: 'Review', description: 'Preview & Confirm' }
];

const PublicationCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();

  // States
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    publicationType: '',
    publicationFormat: '',
    researchType: 'Original Research',
    abstract: '',
    authorsList: [],
    publication: '',
    journal: '',
    conference: '',
    publisher: '',
    publicationDate: new Date().toISOString().split('T')[0],
    doi: '',
    isbn: '',
    issn: '',
    volume: '',
    issue: '',
    pages: '',
    language: 'English',
    license: '',
    funding: '',
    openAccess: false,
    researchAreas: [],
    keywords: [],
    visibility: 'Public',
    fileDetails: null,
    extractionConfidences: null,
    metadataCacheId: ''
  });

  // Read URL query parameter for publicationType
  const typeParam = searchParams.get('publicationType');

  useEffect(() => {
    if (typeParam) {
      setFormData(prev => ({
        ...prev,
        publicationType: typeParam
      }));
      // Auto advance to step 2 if we are on step 1 and url has type
      if (step === 1) {
        setStep(2);
      }
    } else {
      // If URL parameter is removed, reset step to 1
      if (step > 1 && !formData.publicationType) {
        setStep(1);
      }
    }
  }, [typeParam]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTypeSelect = (slug) => {
    handleFieldChange('publicationType', slug);
    // Update URL parameter maintaining browser history
    setSearchParams({ publicationType: slug });
  };

  const handleFormatSelect = (slug) => {
    handleFieldChange('publicationFormat', slug);
  };

  const handleUploadSuccess = ({ r2Data, extractedMetadata, cacheId, originalName }) => {
    // 1. Save file details
    handleFieldChange('fileDetails', {
      ...r2Data,
      originalName
    });

    // 2. Pre-fill fields from metadata extraction
    if (extractedMetadata) {
      setFormData(prev => {
        const updated = {
          ...prev,
          metadataCacheId: cacheId || '',
          fileDetails: {
            ...r2Data,
            originalName
          },
          extractionConfidences: {
            title: extractedMetadata.title?.confidence || 0,
            authors: extractedMetadata.authorsList?.confidence || 0,
            abstract: extractedMetadata.abstract?.confidence || 0,
            doi: extractedMetadata.doi?.confidence || 0,
            keywords: extractedMetadata.keywords?.confidence || 0,
            year: extractedMetadata.year?.confidence || 0,
            journal: extractedMetadata.journal?.confidence || 0
          }
        };

        if (extractedMetadata.title?.value) {
          updated.title = extractedMetadata.title.value;
        }
        if (extractedMetadata.abstract?.value) {
          updated.abstract = extractedMetadata.abstract.value;
        }
        if (extractedMetadata.doi?.value) {
          updated.doi = extractedMetadata.doi.value;
        }
        if (extractedMetadata.isbn?.value) {
          updated.isbn = extractedMetadata.isbn.value;
        }
        if (extractedMetadata.issn?.value) {
          updated.issn = extractedMetadata.issn.value;
        }
        if (extractedMetadata.journal?.value) {
          updated.publication = extractedMetadata.journal.value;
          updated.journal = extractedMetadata.journal.value;
        }
        if (extractedMetadata.publisher?.value) {
          updated.publisher = extractedMetadata.publisher.value;
        }
        if (extractedMetadata.year?.value) {
          updated.publicationDate = `${extractedMetadata.year.value}-01-01`;
        }
        if (extractedMetadata.keywords?.value && extractedMetadata.keywords.value.length > 0) {
          updated.keywords = extractedMetadata.keywords.value;
        }
        if (extractedMetadata.authorsList?.value && extractedMetadata.authorsList.value.length > 0) {
          updated.authorsList = extractedMetadata.authorsList.value.map((name, idx) => ({
            name,
            email: '',
            institution: '',
            department: '',
            isCorresponding: idx === 0,
            order: idx
          }));
        }

        return updated;
      });
    }
  };

  const handleRemoveFile = () => {
    handleFieldChange('fileDetails', null);
  };

  const handleSkipUpload = () => {
    handleFieldChange('fileDetails', null);
    setStep(4);
  };

  const handleNext = () => {
    if (step === 4) {
      if (!formData.title.trim()) {
        toast.error('Publication title is required.');
        return;
      }
      if (!formData.authorsList || formData.authorsList.length === 0) {
        toast.error('At least one Author is required.');
        return;
      }
    }
    setStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    if (step === 2) {
      // Clear URL parameter and reset
      setSearchParams({});
      setStep(1);
    } else {
      setStep(prev => Math.max(prev - 1, 1));
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      toast.error('Publication title is required to save draft.');
      return;
    }
    setIsSavingDraft(true);
    const loadingToast = toast.loading('Saving publication draft...');
    try {
      const response = await publicationService.saveDraft(formData);
      if (response.success) {
        toast.success('Draft saved successfully!', { id: loadingToast });
        
        // Invalidate React Query caches to trigger updates
        queryClient.invalidateQueries({ queryKey: ['publications-portfolio'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['feed'] });

        // Redirect to profile or draft manager
        const profileTarget = user?.slug || user?.profileSlug || user?.username;
        navigate(profileTarget ? `/profile/${profileTarget}` : '/profile');
      } else {
        toast.error(response.message || 'Failed to save draft.', { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error occurred while saving draft.', { id: loadingToast });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    if (!formData.title.trim()) {
      toast.error('Publication title is required.');
      return;
    }
    if (!formData.authorsList || formData.authorsList.length === 0) {
      toast.error('At least one author is required.');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Publishing research in progress...');
    try {
      const response = await publicationService.createPublication(formData);
      if (response.success && response.data) {
        toast.success('Research paper published successfully!', { id: loadingToast });
        
        // Invalidate React Query caches to trigger updates
        queryClient.invalidateQueries({ queryKey: ['publications-portfolio'] });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['feed'] });

        // Redirect to the generated SEO friendly slug page
        const targetSlug = response.data.slug;
        setTimeout(() => {
          navigate(`/publication/${targetSlug}`);
        }, 1000);
      } else {
        toast.error(response.message || 'Failed to publish research.', { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error occurred while publishing.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 py-5 sm:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">

        {/* Back Navigation */}
        <button
          onClick={() => navigate('/publications')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-1 -ml-1 px-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Publications</span>
        </button>

        {/* Step Indicator / Stepper */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => {
              const currentIdx = idx + 1;
              const isActive = step === currentIdx;
              const isCompleted = step > currentIdx;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center relative last:flex-none">
                  {/* Stepper Node */}
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
                  
                  {/* Stepper Label */}
                  <span
                    className={`text-[10px] font-bold mt-1.5 hidden md:block ${
                      isActive ? 'text-blue-600' : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>

                  {/* Horizontal Line between nodes */}
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
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm min-h-[350px] flex flex-col justify-between">
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
                    selectedFormat={formData.publicationFormat}
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
                    currentUser={user}
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-t border-slate-100 pt-5 mt-6 gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors px-4 py-2.5 rounded-xl active:scale-[0.98] order-2 sm:order-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto order-1 sm:order-2">
              {step > 3 && (
                <button
                  type="button"
                  disabled={isSavingDraft || isSubmitting}
                  onClick={handleSaveDraft}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]"
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
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-750 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/10 disabled:opacity-50 active:scale-[0.98]"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Publish Research</span>
                </button>
              ) : step === 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-750 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/10 active:scale-[0.98]"
                >
                  <span>Review Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={
                    (step === 1 && !formData.publicationType) ||
                    (step === 2 && !formData.publicationFormat)
                  }
                  onClick={handleNext}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-750 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/10 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PublicationCreatePage;