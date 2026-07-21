import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, FileText, Download, Eye, Globe, Calendar, 
  Tag, ShieldCheck, User, Building, BookOpen, Clock, Loader2 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import publicationService from '../../../services/publication.service';
import PDFReader from '../components/PDFReader';

const PUB_CATEGORIES = ['Journal Paper', 'Conference Paper', 'Patent', 'Book Chapter', 'Book'];

const getPublicationCategory = (pub) => {
  const explicitType = (pub.publicationType || '').trim().toLowerCase();
  const normalizedMatch = PUB_CATEGORIES.find((c) => c.toLowerCase() === explicitType);
  if (normalizedMatch) return normalizedMatch;

  const haystack = [pub.publication, pub.journal, pub.conference, pub.publisher]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (explicitType === 'patent' || haystack.includes('patent')) return 'Patent';
  if (explicitType === 'book chapter' || haystack.includes('book chapter') || haystack.includes('chapter in')) return 'Book Chapter';
  if (explicitType === 'book' || pub.isbn || (haystack.includes('book') && !haystack.includes('chapter'))) return 'Book';
  if (pub.issn && !haystack.includes('proceedings') && !pub.conference) return 'Journal Paper';
  if (
    explicitType === 'conference' ||
    pub.conference ||
    haystack.includes('proceedings') ||
    haystack.includes('conference') ||
    haystack.includes('symposium') ||
    haystack.includes('workshop')
  ) {
    return 'Conference Paper';
  }
  if (explicitType === 'journal' || explicitType === 'article' || explicitType === 'research paper') return 'Journal Paper';
  if (explicitType) return explicitType.replace(/\b\w/g, (c) => c.toUpperCase());
  return 'Journal Paper';
};

const PublicationDetailPage = () => {
  const { slug, publicationSlug } = useParams();
  const activeSlug = slug || publicationSlug;
  const navigate = useNavigate();
  const fileInputRef = React.useRef(null);
  const [isUploading, setIsUploading] = React.useState(false);

  // Query to fetch publication details (dynamic view counts tracked on backend)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['publication', activeSlug],
    queryFn: async () => {
      const res = await publicationService.getPublicationBySlug(activeSlug);
      return res.success ? res.data : null;
    },
    staleTime: 0 // Fetch views freshest
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await publicationService.uploadFile(formData);
      if (uploadResponse.success) {
        await publicationService.updatePublication(data.id || data._id, {
          fileDetails: {
            ...uploadResponse.data,
            originalName: file.name
          }
        });
        toast.success('Document uploaded successfully!');
        refetch();
      } else {
        toast.error(uploadResponse.message || 'File upload failed.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error occurred during file upload.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = async () => {
    if (!data) return;
    try {
      // 1. Record download event
      await publicationService.trackDownload(data.id || data._id);
      
      // 2. Refresh query to get updated downloads count
      refetch();
      
      // 3. Open PDF URL in new window
      window.open(data.pdfUrl, '_blank');
      toast.success('Download registered successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Could not track download.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading publication details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-900">Publication Not Found</h3>
          <p className="text-xs text-slate-500">The publication may have been deleted or is unavailable.</p>
          <button
            onClick={() => navigate('/')}
            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-all"
          >
            Go to Home Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Back Navigation Header */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
 
        {/* 2-Column Reader Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: PDF Reader */}
          {data.pdfUrl ? (
            <div className="lg:col-span-2">
              <PDFReader
                title={data.title}
                pdfUrl={data.pdfUrl}
                authors={data.authors}
                journal={data.publication || data.journal}
                year={data.year}
                doi={data.doi}
                onDownload={handleDownload}
              />
            </div>
          ) : (
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs min-h-[400px] flex flex-col items-center justify-center gap-3">
              <FileText className="w-12 h-12 text-slate-300" />
              <h3 className="text-sm font-extrabold text-slate-800">No Document File Attached</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-normal">
                This publication was published as metadata-only. Full text PDF is not available.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2 rounded-xl transition-all"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 rotate-180" />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          )}

          {/* Right Column: Metadata Detail Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
              
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold tracking-wider uppercase bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded">
                  {getPublicationCategory(data)}
                </span>
                <h1 className="text-base font-extrabold text-slate-950 leading-snug">
                  {data.title}
                </h1>
                {data.subtitle && (
                  <p className="text-xs text-slate-500 italic leading-snug">{data.subtitle}</p>
                )}
              </div>

              {/* Authors Row */}
              <div className="flex flex-wrap gap-1.5 pt-1 border-b border-slate-100 pb-4">
                {data.authorsList && data.authorsList.length > 0 ? (
                  data.authorsList.map((author, index) => (
                    <span
                      key={index}
                      className="bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1 text-[10px] font-semibold text-slate-700 flex items-center gap-1"
                    >
                      <User className="w-3 h-3 text-slate-400" />
                      <span>{author.name}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">{data.authors}</span>
                )}
              </div>

              {/* Metrics summary */}
              <div className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-4">
                <div className="text-center bg-slate-50/50 p-2.5 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Reads</span>
                  <span className="text-xs font-black text-slate-800 block mt-0.5">{data.views || 0}</span>
                </div>
                <div className="text-center bg-slate-50/50 p-2.5 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Downloads</span>
                  <span className="text-xs font-black text-slate-800 block mt-0.5">{data.downloads || 0}</span>
                </div>
                <div className="text-center bg-slate-50/50 p-2.5 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Citations</span>
                  <span className="text-xs font-black text-slate-800 block mt-0.5">{data.citations || 0}</span>
                </div>
              </div>

              {/* Abstract */}
              {data.abstract && (
                <div className="space-y-1.5">
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Abstract</h2>
                  <p className="text-xs text-slate-650 leading-relaxed text-justify line-clamp-6" title={data.abstract}>
                    {data.abstract}
                  </p>
                </div>
              )}

              {/* Venue Details */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Metadata Details</h2>
                <div className="space-y-2 text-xs">
                  {data.publicationCode && (
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-bold">Publication ID</span>
                      <span className="font-bold text-slate-850 block mt-0.5">
                        {data.publicationCode}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="block text-[9px] text-slate-400 uppercase font-bold">Visibility</span>
                    <span className="font-bold text-slate-850 inline-flex items-center gap-1 mt-0.5">
                      <Globe className="w-3.5 h-3.5 text-slate-450" />
                      <span>{data.visibility || 'Public'}</span>
                    </span>
                  </div>

                  {(data.publication || data.journal || data.conference) && (
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-bold">Venue</span>
                      <span className="font-bold text-slate-850 block mt-0.5 truncate">
                        {data.publication || data.journal || data.conference}
                      </span>
                    </div>
                  )}

                  {data.publicationDate && (
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-bold">Published Date</span>
                      <span className="font-bold text-slate-850 block mt-0.5">
                        {new Date(data.publicationDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {data.doi && (
                    <div>
                      <span className="block text-[9px] text-slate-400 uppercase font-bold">DOI</span>
                      <a href={`https://doi.org/${data.doi}`} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline block mt-0.5 truncate">
                        {data.doi}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {(data.researchAreasList?.length > 0 || data.keywordsList?.length > 0) && (
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5">
                  {data.researchAreasList?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {data.researchAreasList.map((area, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-600 font-bold text-[9px] px-2 py-0.5 rounded-full">
                          {area}
                        </span>
                      ))}
                    </div>
                  )}
                  {data.keywordsList?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {data.keywordsList.map((kw, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-650 font-bold text-[9px] px-2 py-0.5 rounded-full">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PublicationDetailPage;