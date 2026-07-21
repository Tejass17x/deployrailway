import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Globe, ExternalLink, Tag, CheckCircle2 } from 'lucide-react';

const TYPE_COLORS = {
  'Article': 'bg-blue-50 text-blue-700 border-blue-100',
  'Conference': 'bg-purple-50 text-purple-700 border-purple-100',
  'Book Chapter': 'bg-orange-50 text-orange-700 border-orange-100',
  'Thesis': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Patent': 'bg-yellow-50 text-yellow-700 border-yellow-100',
  'Dataset': 'bg-pink-50 text-pink-700 border-pink-100',
  'Preprint': 'bg-slate-50 text-slate-700 border-slate-100',
};

const PublicationHeader = ({ publication }) => {
  if (!publication) return null;

  const {
    title,
    subtitle,
    publicationType = 'Article',
    status,
    visibility,
    doi,
    paperURL,
    openAccess,
    googleScholarVerified,
    publicationCode,
  } = publication;

  const typeBadgeClass = TYPE_COLORS[publicationType] || TYPE_COLORS['Article'];

  return (
    <div className="space-y-4">
      {/* Type & Status Badges Row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold tracking-wider uppercase border px-2.5 py-1 rounded-lg ${typeBadgeClass}`}>
          <Tag className="w-3 h-3" />
          {publicationType}
        </span>

        {openAccess && (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg">
            <Globe className="w-3 h-3" />
            Open Access
          </span>
        )}

        {googleScholarVerified && (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-3 h-3" />
            Scholar Verified
          </span>
        )}

        {status === 'published' && visibility === 'Public' && (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-3 h-3" />
            Peer Reviewed
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 leading-snug">
        {title}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-slate-500 italic leading-relaxed">{subtitle}</p>
      )}

      {/* DOI & Paper URL */}
      <div className="flex flex-wrap gap-4 pt-1">
        {doi && (
          <a
            href={`https://doi.org/${doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            DOI: {doi}
          </a>
        )}
        {paperURL && !doi && (
          <a
            href={paperURL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on External Source
          </a>
        )}
        {publicationCode && (
          <span className="text-xs text-slate-400 font-mono font-bold">
            ID: {publicationCode}
          </span>
        )}
      </div>
    </div>
  );
};

export default PublicationHeader;
