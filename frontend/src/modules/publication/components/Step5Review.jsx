import React from 'react';
import { FileText, Eye, CheckCircle2, User, Globe, Calendar, Tag, ShieldCheck } from 'lucide-react';

const Step5Review = ({ formData, fileDetails }) => {
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-left text-slate-800">
      <div className="text-center">
        <h2 className="text-xl font-extrabold text-slate-900">Review & Confirm</h2>
        <p className="text-xs text-slate-500 mt-1">Review your publication metadata before sharing it with the research network</p>
      </div>

      {/* Premium Preview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
              {formData.publicationType || 'RESEARCH ARTICLE'}
            </span>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              {formData.title || 'Untitled Research'}
            </h3>
            {formData.subtitle && (
              <p className="text-xs text-slate-500 italic">{formData.subtitle}</p>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready</span>
          </span>
        </div>

        {/* Authors */}
        {formData.authorsList && formData.authorsList.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Authors</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {formData.authorsList.map((author, index) => (
                <span key={index} className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 font-semibold text-slate-700 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>{author.name}</span>
                  {author.isCorresponding && (
                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded font-bold shrink-0">Corresponding</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Abstract */}
        {formData.abstract && (
          <div className="space-y-1 border-t border-slate-100 pt-3">
            <h4 className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Abstract</h4>
            <p className="text-xs text-slate-600 leading-relaxed text-justify line-clamp-4">
              {formData.abstract}
            </p>
          </div>
        )}

        {/* Dynamic Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-xs">
          <div>
            <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">Visibility</span>
            <span className="inline-flex items-center gap-1 font-bold text-slate-800 mt-0.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{formData.visibility || 'Public'}</span>
            </span>
          </div>

          {(formData.publication || formData.journal || formData.conference) && (
            <div>
              <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">Venue</span>
              <span className="font-bold text-slate-800 block truncate mt-0.5">
                {formData.publication || formData.journal || formData.conference}
              </span>
            </div>
          )}

          {formData.publicationDate && (
            <div>
              <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">Publish Date</span>
              <span className="font-bold text-slate-800 block mt-0.5">
                {new Date(formData.publicationDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          )}

          {formData.doi && (
            <div>
              <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">DOI</span>
              <span className="font-bold text-slate-800 block truncate mt-0.5">
                {formData.doi}
              </span>
            </div>
          )}

          {formData.license && (
            <div>
              <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">License</span>
              <span className="font-bold text-slate-800 block truncate mt-0.5">
                {formData.license}
              </span>
            </div>
          )}

          {formData.funding && (
            <div>
              <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">Funding</span>
              <span className="font-bold text-slate-800 block truncate mt-0.5">
                {formData.funding}
              </span>
            </div>
          )}

          {formData.openAccess && (
            <div>
              <span className="block text-[9px] font-bold tracking-wider text-slate-400 uppercase">Access</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 mt-0.5 animate-pulse">
                <span>Open Access</span>
              </span>
            </div>
          )}
        </div>

        {/* File Section */}
        {fileDetails?.secure_url ? (
          <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 rounded-xl p-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <span className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <FileText className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
                  {fileDetails.originalName || 'uploaded_document'}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {formatBytes(fileDetails.bytes)} • {fileDetails.format?.toUpperCase() || 'PDF'}
                </p>
              </div>
            </div>
            <a
              href={fileDetails.secure_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline shrink-0 whitespace-nowrap self-start sm:self-auto"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Link</span>
            </a>
          </div>
        ) : (
          <div className="border-t border-slate-100 pt-4 text-center py-2 bg-slate-50/30 rounded-xl">
            <p className="text-xs font-semibold text-slate-400 italic">No full-text file attached.</p>
          </div>
        )}

        {/* Keywords and Research Areas */}
        {(formData.keywords?.length > 0 || formData.researchAreas?.length > 0) && (
          <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
            {formData.researchAreas?.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase shrink-0 mt-1">Research Areas:</span>
                <div className="flex flex-wrap gap-1">
                  {formData.researchAreas.map((area, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-600 font-bold text-[9px] px-2 py-0.5 rounded-full">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {formData.keywords?.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase shrink-0 mt-1">Keywords:</span>
                <div className="flex flex-wrap gap-1">
                  {formData.keywords.map((kw, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-600 font-bold text-[9px] px-2 py-0.5 rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step5Review;
