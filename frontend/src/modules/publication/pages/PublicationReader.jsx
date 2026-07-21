import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ThumbsUp, Bookmark, Globe, Calendar, Building,
  Loader2, AlertCircle, BookOpen, Download, Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';

import publicationService from '../../../services/publication.service';
import PublicationHeader from '../components/PublicationHeader';
import AuthorList from '../components/AuthorList';
import AbstractCard from '../components/AbstractCard';
import KeywordTags from '../components/KeywordTags';
import PDFViewer from '../components/PDFViewer';
import MetricsCard from '../components/MetricsCard';
import CitationExport from '../components/CitationExport';
import SharePanel from '../components/SharePanel';
import CommentSection from '../components/CommentSection';
import RelatedPublicationsPanel from '../components/RelatedPublicationsPanel';
import RelatedResearchersPanel from '../components/RelatedResearchersPanel';

/* ─── SEO Meta Helper ─────────────────────────────────────────────── */
const setDocumentMeta = (pub) => {
  if (!pub) return;
  document.title = `${pub.title} | Research Connect`;
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = (pub.abstract || pub.title || '').slice(0, 160);

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = `${window.location.origin}/publications/${pub.slug}`;
};

/* ─── Main Component ─────────────────────────────────────────────── */
const PublicationReader = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useSelector(s => s.auth?.user);
  const [recommended, setRecommended] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);

  // ── Fetch Publication ──────────────────────────────────────────────
  const {
    data: pub,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['publication-reader', slug],
    queryFn: async () => {
      const res = await publicationService.getPublicationBySlug(slug);
      if (res.success) return res.data;
      throw new Error(res.message || 'Not found');
    },
    enabled: !!slug,
    staleTime: 0,
    retry: 1,
  });

  // ── Track View ─────────────────────────────────────────────────────
  useEffect(() => {
    if (pub && !viewTracked) {
      const id = pub._id || pub.id;
      publicationService.trackView(id).catch(() => {});
      setViewTracked(true);
    }
  }, [pub, viewTracked]);

  // ── SEO Meta ───────────────────────────────────────────────────────
  useEffect(() => {
    if (pub) {
      setDocumentMeta(pub);
      // Restore doc title on unmount
      return () => { document.title = 'Research Connect'; };
    }
  }, [pub]);

  // ── Set initial bookmark/recommend state ───────────────────────────
  useEffect(() => {
    if (pub && currentUser) {
      const uid = currentUser._id || currentUser.id;
      setBookmarked(!!(pub.bookmarkedBy?.includes?.(uid)));
      setRecommended(!!(pub.recommendedBy?.includes?.(uid)));
    }
  }, [pub, currentUser]);

  // ── Recommend Mutation ─────────────────────────────────────────────
  const recommendMutation = useMutation({
    mutationFn: () => publicationService.toggleRecommendation(pub._id || pub.id),
    onMutate: () => setRecommended(v => !v),
    onSuccess: () => {
      queryClient.invalidateQueries(['publication-reader', slug]);
    },
    onError: () => {
      setRecommended(v => !v);
      toast.error('Could not update recommendation.');
    },
  });

  // ── Bookmark Mutation ──────────────────────────────────────────────
  const bookmarkMutation = useMutation({
    mutationFn: () => publicationService.toggleBookmark(pub._id || pub.id),
    onMutate: () => setBookmarked(v => !v),
    onSuccess: () => {
      toast.success(bookmarked ? 'Removed from saved.' : 'Saved to library.');
      queryClient.invalidateQueries(['publication-reader', slug]);
    },
    onError: () => {
      setBookmarked(v => !v);
      toast.error('Could not save publication.');
    },
  });

  // ── Download Handler ───────────────────────────────────────────────
  const handleDownload = async () => {
    if (!pub) return;
    try {
      await publicationService.trackDownload(pub._id || pub.id);
      window.open(pub.pdfUrl, '_blank');
      toast.success('Download started.');
      refetch();
    } catch {
      toast.error('Could not track download.');
    }
  };

  /* ── Loading State ─────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-65px)] bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-400">Loading publication…</p>
        </div>
      </div>
    );
  }

  /* ── Error / Not Found State ───────────────────────────────────── */
  if (error || !pub) {
    return (
      <div className="min-h-[calc(100vh-65px)] bg-[#F8FAFC] flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-slate-300" />
          </div>
          <h1 className="text-lg font-extrabold text-slate-900">Publication Not Found</h1>
          <p className="text-sm text-slate-500">
            This publication may have been removed, made private, or the link is incorrect.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-xl transition-all"
            >
              Go Back
            </button>
            <Link
              to="/"
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-all"
            >
              Home Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pubId = pub._id || pub.id;
  const authors = pub.authorsList || [];
  const keywords = pub.keywordsList || [];
  const researchAreas = pub.researchAreasList || [];
  const venue = pub.publication || pub.journal || pub.conference;
  const pubYear = pub.year || pub.publicationYear || (pub.publicationDate ? new Date(pub.publicationDate).getFullYear() : null);

  return (
    <div className="min-h-[calc(100vh-65px)] bg-[#F8FAFC]">
      {/* SEO-friendly structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ScholarlyArticle",
        "headline": pub.title,
        "description": pub.abstract,
        "author": authors.map(a => ({ "@type": "Person", "name": a.name })),
        "datePublished": pub.publicationDate,
        "publisher": { "@type": "Organization", "name": "Research Connect" },
        ...(pub.doi ? { "identifier": { "@type": "PropertyValue", "propertyID": "DOI", "value": pub.doi } } : {}),
      }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')}} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Top Navigation Bar ─────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Recommend */}
            {currentUser && (
              <button
                onClick={() => recommendMutation.mutate()}
                disabled={recommendMutation.isPending}
                className={`inline-flex items-center gap-1.5 text-xs font-bold border px-3.5 py-2 rounded-xl transition-all shadow-xs ${
                  recommended
                    ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                {recommended ? 'Recommended' : 'Recommend'}
              </button>
            )}

            {/* Bookmark */}
            {currentUser && (
              <button
                onClick={() => bookmarkMutation.mutate()}
                disabled={bookmarkMutation.isPending}
                className={`inline-flex items-center gap-1.5 text-xs font-bold border px-3.5 py-2 rounded-xl transition-all shadow-xs ${
                  bookmarked
                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                {bookmarked ? 'Saved' : 'Save'}
              </button>
            )}

            {/* Download (if file) */}
            {pub.pdfUrl && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 px-3.5 py-2 rounded-xl transition-all shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            )}

            {/* Share */}
            <SharePanel publication={pub} />
          </div>
        </div>

        {/* ── 2-Column Layout ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── Left / Main Column ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Publication Header Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
              <PublicationHeader publication={pub} />

              {/* Venue & Date strip */}
              {(venue || pubYear) && (
                <div className="flex flex-wrap gap-4 pt-1 border-t border-slate-100">
                  {venue && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                      {venue}
                    </span>
                  )}
                  {pubYear && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {pubYear}
                    </span>
                  )}
                  {pub.institution && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {pub.institution}
                    </span>
                  )}
                  {pub.visibility === 'Public' && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                      <Globe className="w-3.5 h-3.5" />
                      Public
                    </span>
                  )}
                </div>
              )}

              {/* Authors */}
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Authors</p>
                <AuthorList authors={authors} plainAuthorsString={pub.authors} />
              </div>
            </div>

            {/* Abstract */}
            <AbstractCard abstract={pub.abstract} />

            {/* Keywords */}
            {(keywords.length > 0 || researchAreas.length > 0) && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <KeywordTags keywords={keywords} researchAreas={researchAreas} />
              </div>
            )}

            {/* PDF Viewer */}
            <PDFViewer
              pdfUrl={pub.pdfUrl}
              title={pub.title}
              onDownload={pub.pdfUrl ? handleDownload : null}
            />

            {/* Citation Export */}
            <CitationExport publication={pub} />

            {/* Comments */}
            <CommentSection publicationId={pubId} />
          </div>

          {/* ── Right / Sidebar Column ─────────────────────────── */}
          <div className="lg:col-span-1 space-y-5 sticky top-6">
            {/* Metrics */}
            <MetricsCard
              publication={pub}
              bookmarked={bookmarked}
              recommended={recommended}
            />

            {/* Related Publications */}
            <RelatedPublicationsPanel publicationId={pubId} />

            {/* Related Researchers */}
            <RelatedResearchersPanel publicationId={pubId} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default PublicationReader;
