import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Eye, Download, BookMarked, Quote, ThumbsUp, Share2,
  BarChart2, ArrowLeft, Calendar, TrendingUp, FileText,
  RefreshCw, ExternalLink, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

import analyticsService from '../../../services/analytics.service';
import MetricSummaryCard from '../components/analytics/MetricSummaryCard';
import TrendChart from '../components/analytics/TrendChart';

const PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

const SectionTitle = ({ icon: Icon, title, subtitle, iconColor = 'text-blue-600', iconBg = 'bg-blue-50' }) => (
  <div className="flex items-start gap-3 mb-5">
    <div className={`w-10 h-10 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div>
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const PublicationAnalyticsPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('30d');

  // We need the publication's _id from slug — we'll get it from the analytics endpoint
  // The analytics endpoint accepts _id. We'll first fetch by slug to get ID.
  const pubQuery = useQuery({
    queryKey: ['pub-for-analytics', slug],
    queryFn: async () => {
      const { default: axios } = await import('../../../api/axiosInstance');
      const { data } = await axios.get(`/v1/publications/${slug}`);
      return data?.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const pubId = pubQuery.data?.id || pubQuery.data?._id;

  const analyticsQuery = useQuery({
    queryKey: ['pub-analytics', pubId],
    queryFn: () => analyticsService.getPublicationAnalytics(pubId),
    enabled: !!pubId,
    staleTime: 60 * 1000,
  });

  const viewsQuery = useQuery({
    queryKey: ['pub-views-timeline', pubId, period],
    queryFn: () => analyticsService.getViewsTimeline(pubId, period),
    enabled: !!pubId,
    staleTime: 60 * 1000,
  });

  const downloadsQuery = useQuery({
    queryKey: ['pub-downloads-timeline', pubId, period],
    queryFn: () => analyticsService.getDownloadsTimeline(pubId, period),
    enabled: !!pubId,
    staleTime: 60 * 1000,
  });

  const analytics = analyticsQuery.data || {};
  const { summary = {}, publication: pubInfo = {}, recentActivity = {} } = analytics;

  const viewsTimeline = viewsQuery.data?.timeline || [];
  const downloadsTimeline = downloadsQuery.data?.timeline || [];

  // Build combined timeline for dual-series chart
  const combinedTimeline = viewsTimeline.map((v, i) => ({
    date: v.date,
    views: v.views,
    downloads: downloadsTimeline[i]?.downloads || 0,
  }));

  const isLoading = analyticsQuery.isLoading || pubQuery.isLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-8 bg-gray-200 rounded-xl w-64 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-2xl border border-gray-200 animate-pulse" />
            ))}
          </div>
          <div className="h-72 bg-white rounded-2xl border border-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (analyticsQuery.isError) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <BarChart2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Analytics Unavailable</h2>
          <p className="text-gray-500 text-sm mb-4">You can only view analytics for your own publications.</p>
          <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900 truncate max-w-lg">
                {pubInfo.title || pubQuery.data?.title || 'Publication Analytics'}
              </h1>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <BarChart2 className="w-3 h-3" /> Analytics Dashboard
                {pubInfo.publishedAt && (
                  <span className="ml-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Published {new Date(pubInfo.publishedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/publications/${slug}`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> View Publication
            </Link>
            <button
              onClick={() => { analyticsQuery.refetch(); viewsQuery.refetch(); downloadsQuery.refetch(); }}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${analyticsQuery.isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Summary Metrics */}
        <section>
          <SectionTitle icon={TrendingUp} title="Performance Overview" subtitle="All-time statistics for this publication" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            <MetricSummaryCard icon={Eye} label="Total Views" value={summary.totalViews} color="blue" index={0} />
            <MetricSummaryCard icon={Download} label="Total Downloads" value={summary.totalDownloads} color="green" index={1} />
            <MetricSummaryCard icon={BookMarked} label="Bookmarks" value={summary.totalBookmarks} color="purple" index={2} />
            <MetricSummaryCard icon={Quote} label="Citations" value={summary.totalCitations} color="orange" index={3} />
            <MetricSummaryCard icon={ThumbsUp} label="Recommendations" value={summary.totalRecommendations} color="teal" index={4} />
            <MetricSummaryCard icon={Quote} label="Citation Copies" value={summary.totalCitationCopies} color="rose" index={5} />
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-xl font-bold text-blue-600 tabular-nums">{(recentActivity.views7d || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Views (7d)</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-xl font-bold text-green-600 tabular-nums">{(recentActivity.downloads7d || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Downloads (7d)</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-xl font-bold text-blue-500 tabular-nums">{(recentActivity.views30d || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Views (30d)</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-xl font-bold text-green-500 tabular-nums">{(recentActivity.downloads30d || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Downloads (30d)</p>
            </div>
          </div>
        </section>

        {/* Combined Trend Chart */}
        <section>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <SectionTitle
                icon={BarChart2}
                title="Engagement Trend"
                subtitle="Views and downloads over time"
                iconColor="text-blue-600"
                iconBg="bg-blue-50"
              />
              {/* Period Toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
                {PERIODS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      period === p.value ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {viewsQuery.isLoading || downloadsQuery.isLoading ? (
              <div className="h-56 bg-gray-50 rounded-2xl animate-pulse" />
            ) : (
              <TrendChart
                data={combinedTimeline}
                type="area"
                xKey="date"
                height={220}
                showLegend
                series={[
                  { key: 'views', color: '#2563EB', label: 'Views' },
                  { key: 'downloads', color: '#059669', label: 'Downloads' },
                ]}
              />
            )}
          </div>
        </section>

        {/* Views Chart Only */}
        <section>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <SectionTitle icon={Eye} title="Views Timeline" subtitle={`Daily views over the last ${period}`} iconColor="text-blue-600" iconBg="bg-blue-50" />
            {viewsQuery.isLoading ? (
              <div className="h-44 bg-gray-50 rounded-2xl animate-pulse" />
            ) : (
              <TrendChart
                data={viewsTimeline}
                type="area"
                dataKey="views"
                xKey="date"
                color="#2563EB"
                label="Views"
                height={180}
              />
            )}
          </div>
        </section>

        {/* Downloads Chart Only */}
        <section>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <SectionTitle icon={Download} title="Downloads Timeline" subtitle={`Daily downloads over the last ${period}`} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
            {downloadsQuery.isLoading ? (
              <div className="h-44 bg-gray-50 rounded-2xl animate-pulse" />
            ) : (
              <TrendChart
                data={downloadsTimeline}
                type="bar"
                dataKey="downloads"
                xKey="date"
                color="#059669"
                label="Downloads"
                height={180}
              />
            )}
          </div>
        </section>

        {/* Research Score */}
        {summary.researchScore !== undefined && (
          <section>
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-200 mb-1">Research Score</p>
                  <p className="text-4xl font-bold tabular-nums">{summary.researchScore}</p>
                  <p className="text-sm text-blue-200 mt-2">Based on citations, views, downloads, and engagement metrics</p>
                </div>
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PublicationAnalyticsPage;
