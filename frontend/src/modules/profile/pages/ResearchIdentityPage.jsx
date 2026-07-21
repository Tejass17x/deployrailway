import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Compass, Link2, BookOpen, GraduationCap, CheckCircle, 
  Loader2, Linkedin, Award, Play, AlertCircle, ArrowRight, Info 
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import scholarService from '../../../services/scholar.service';
import { updateProfileState } from '../../../redux/slices/authSlice';
import Button from '../../../components/common/buttons/Button';
import Input from '../../../components/common/inputs/Input';

const ResearchIdentityPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { profile, user } = useSelector((state) => state.auth);
  const profileSlug = user?.profileSlug || user?.slug || user?.username;

  // Form State
  const [formData, setFormData] = useState({
    googleScholar: profile?.socialLinks?.googleScholar || '',
    orcid: profile?.socialLinks?.orcid || '',
    linkedin: profile?.socialLinks?.linkedin || '',
    researchGate: profile?.socialLinks?.researchGate || '',
    scopus: profile?.socialLinks?.scopus || ''
  });

  // Syncing/Import Status State
  const [step, setStep] = useState(1); // 1: Connect IDs, 2: Sync Progress, 3: Success Screen
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [jobId, setJobId] = useState(null);

  // Ref for auto scrolling logs
  const logEndRef = useRef(null);

  // Handlers
  const handleInputChange = (field, val) => {
    const value = val && typeof val === 'object' && val.target ? val.target.value : val;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Form Validations
  const validateForm = () => {
    const { googleScholar, orcid, linkedin, researchGate, scopus } = formData;
    
    if (googleScholar) {
      const scholarRegex = /^https?:\/\/(www\.)?scholar\.google\.[a-z.]+\/citations\?.*user=([a-zA-Z0-9_-]{8,16}|[a-zA-Z0-9_-]{12})/;
      if (!scholarRegex.test(googleScholar)) {
        return toast.error('Please provide a valid Google Scholar profile URL (e.g., https://scholar.google.com/citations?user=XXXXXXXX)');
      }
    }

    if (orcid) {
      const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/;
      if (!orcidRegex.test(orcid)) {
        return toast.error('Please enter a valid ORCID ID (e.g., 0000-0002-1825-0097)');
      }
    }

   

    if (linkedin && !linkedin.includes('linkedin.com')) {
      return toast.error('Please enter a valid LinkedIn URL');
    }

    if (researchGate && !researchGate.includes('researchgate.net')) {
      return toast.error('Please enter a valid ResearchGate URL');
    }

    if (scopus && isNaN(scopus)) {
      return toast.error('Scopus Author ID must be numeric');
    }

    return true;
  };

  const handleConnect = async (e) => {
    if (e) e.preventDefault();
    if (validateForm() !== true) return;

    setLoading(true);
    try {
      // 1. Save Identity Links
      const res = await scholarService.saveResearchIdentity(formData);
      if (res.success) {
        dispatch(updateProfileState({
          ...profile,
          socialLinks: res.data.socialLinks,
          profileCompletion: res.data.profileCompletion
        }));

        // 2. Start Sync Queue if Google Scholar is provided
        if (formData.googleScholar) {
          const syncRes = await scholarService.startImport();
          if (syncRes.success && syncRes.data?.job) {
            setJobId(syncRes.data.job._id);
            setStep(2);
          } else {
            setStep(3);
          }
        } else {
          setStep(3);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to connect identities');
    } finally {
      setLoading(false);
    }
  };

  // Poll status when in Step 2
  useEffect(() => {
    if (step !== 2) return;

    let pollInterval = setInterval(async () => {
      try {
        const res = jobId 
          ? await scholarService.getImportStatusById(jobId)
          : await scholarService.getImportStatus();
          
        if (res.success && res.data) {
          const { job, logs } = res.data;
          if (job) {
            setProgress(job.progress);
            setLogs(logs || []);

            if (job.status === 'completed') {
              clearInterval(pollInterval);
              // Invalidate cached profile so the profile page refetches synced data
              queryClient.invalidateQueries({ queryKey: ['profile', profileSlug] });
              // Fetch summary metrics to display on success page
              try {
                const summaryRes = await scholarService.getProfile();
                if (summaryRes.success) setSummaryData(summaryRes.data);
              } catch (e) {
                console.error(e);
              }
              setStep(3);
            } else if (job.status === 'failed') {
              clearInterval(pollInterval);
              toast.error(job.error?.message || 'Sync failed. Please retry.');
              setStep(1);
            }
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [step, jobId]);

  // Scroll to bottom of logs on updates
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getProgressPhase = (prog) => {
    if (prog < 10) return 'Validating Google Scholar URL...';
    if (prog >= 10 && prog < 20) return 'Connecting & fetching author details...';
    if (prog >= 20 && prog < 50) return 'Downloading publications portfolio...';
    if (prog >= 50 && prog < 70) return 'Reconstructing citation history graph...';
    if (prog >= 70 && prog < 85) return 'Indexing co-author network...';
    if (prog >= 85 && prog < 95) return 'Safeguarding user-modified fields...';
    if (prog >= 95 && prog < 100) return 'Recalculating derived analytics...';
    return 'Synchronization complete!';
  };

  return (
    <div className="max-w-4xl lg:max-w-5xl mx-auto py-4 px-3 sm:py-6 sm:px-4">
      {/* Onboarding Steps Visual Indicator */}
      <div className="flex justify-between items-center mb-4 sm:mb-6 max-w-[260px] sm:max-w-md mx-auto">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${
              step >= s ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-text-secondary border border-border'
            }`}>
              {s}
            </div>
            {s < 3 && (
              <div className={`h-1 w-10 sm:w-16 mx-1.5 sm:mx-2 rounded ${
                step > s ? 'bg-primary' : 'bg-slate-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="connect-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border shadow-sm"
          >
            <div className="text-center mb-4 sm:mb-6">
              <Compass className="w-8 h-8 sm:w-10 sm:h-10 text-primary mx-auto mb-2" />
              <h2 className="text-lg sm:text-2xl font-black text-text-primary tracking-tight">Connect Academic Identities</h2>
              <p className="text-xs text-text-secondary mt-1 max-w-lg mx-auto">
                Link your Google Scholar profile to synchronize your academic publications, co-authors, citations timeline, and unlock derived metrics.
              </p>
            </div>

            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl sm:rounded-2xl px-3 py-2.5 mb-4">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 font-medium leading-relaxed">
                Already connected an account? You can review, update, or disconnect any linked profile anytime from Settings → Connected Accounts.
              </p>
            </div>

            <form onSubmit={handleConnect} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              <Input
                label="Google Scholar Profile URL"
                placeholder="https://scholar.google.com/citations?user=..."
                value={formData.googleScholar}
                onChange={(val) => handleInputChange('googleScholar', val)}
              />
              <Input
                label="ORCID ID"
                placeholder="0000-0002-1825-0097"
                value={formData.orcid}
                onChange={(val) => handleInputChange('orcid', val)}
              />
             
              <Input
                label="LinkedIn URL"
                placeholder="https://linkedin.com/in/yourusername"
                value={formData.linkedin}
                onChange={(val) => handleInputChange('linkedin', val)}
              />
              <Input
                label="ResearchGate URL (Optional)"
                placeholder="https://researchgate.net/profile/yourname"
                value={formData.researchGate}
                onChange={(val) => handleInputChange('researchGate', val)}
              />
              <Input
                label="Scopus Author ID (Optional)"
                placeholder="57218320491"
                value={formData.scopus}
                onChange={(val) => handleInputChange('scopus', val)}
              />

              <div className="col-span-1 md:col-span-2 lg:col-span-3 pt-2 sm:pt-3 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full sm:flex-grow py-3.5 text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2"
                  loading={loading}
                  icon={<Play className="w-4 h-4" />}
                >
                  Import Profile Portfolio
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/')}
                  className="w-full sm:flex-grow py-3.5 text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2"
                >
                  Skip for Now
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="sync-progress"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border shadow-sm text-center"
          >
            <div className="mb-4 sm:mb-5">
              <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-spin mx-auto mb-2" />
              <h3 className="text-base sm:text-xl font-black text-text-primary tracking-tight px-2">Syncing Google Scholar Portfolio</h3>
              <p className="text-xs text-text-secondary mt-1 font-medium px-2">
                {getProgressPhase(progress)}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-4 sm:mb-5 border border-slate-200/50">
              <div 
                className="bg-gradient-to-r from-primary to-accent-indigo h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-extrabold text-text-secondary mb-4 sm:mb-5 uppercase tracking-wider">
              <span>Status: Synchronizing</span>
              <span>{progress}% Completed</span>
            </div>

            {/* Live Terminal Log Stream */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 font-mono text-[10px] sm:text-[11px] h-40 sm:h-48 overflow-y-auto space-y-2 scrollbar-thin text-left text-slate-300 shadow-inner">
              {logs.map((log, idx) => (
                <div key={idx} className={`leading-normal break-words ${
                  log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-emerald-400'
                }`}>
                  <span className="text-slate-500 font-bold mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  {log.message}
                </div>
              ))}
              {logs.length === 0 && <p className="text-slate-500 italic">Queue worker establishing connection...</p>}
              <div ref={logEndRef} />
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="success-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-border text-center shadow-sm"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-accent-green/10 text-accent-green rounded-full flex items-center justify-center mx-auto mb-3 border border-accent-green/20">
              <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-text-primary tracking-tight px-2">Academic Identity Synchronized!</h2>
            <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto leading-relaxed px-2">
              Your Google Scholar portfolio and citation graph have been imported into MongoDB. All manual fields are locked and protected.
            </p>

            {/* Metrics cards overview */}
            {summaryData && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 my-4 sm:my-6 max-w-lg mx-auto">
                <div className="p-2.5 sm:p-3.5 bg-bg-page border border-border rounded-xl sm:rounded-2xl shadow-sm">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto mb-1" />
                  <p className="text-[9px] sm:text-[10px] text-text-secondary uppercase font-bold tracking-wider">Publications</p>
                  <p className="text-sm sm:text-lg font-black text-text-primary mt-1">Synced</p>
                </div>
                <div className="p-2.5 sm:p-3.5 bg-bg-page border border-border rounded-xl sm:rounded-2xl shadow-sm">
                  <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-accent-indigo mx-auto mb-1" />
                  <p className="text-[9px] sm:text-[10px] text-text-secondary uppercase font-bold tracking-wider">Citations</p>
                  <p className="text-sm sm:text-lg font-black text-text-primary mt-1">{summaryData.totalCitations || 0}</p>
                </div>
                <div className="p-2.5 sm:p-3.5 bg-bg-page border border-border rounded-xl sm:rounded-2xl shadow-sm">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-accent-orange mx-auto mb-1" />
                  <p className="text-[9px] sm:text-[10px] text-text-secondary uppercase font-bold tracking-wider">h-index</p>
                  <p className="text-sm sm:text-lg font-black text-text-primary mt-1">{summaryData.hIndex || 0}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
              <Button
                variant="primary"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ['profile', profileSlug] });
                  navigate(`/profile/${profileSlug}`);
                }}
                className="w-full sm:w-auto py-3 px-8 text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                View Your Profile
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/')}
                className="w-full sm:w-auto py-3 px-8 text-xs font-black uppercase tracking-wider flex justify-center items-center gap-2"
              >
                Go to Home Feed
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResearchIdentityPage;