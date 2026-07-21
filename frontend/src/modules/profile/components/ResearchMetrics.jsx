import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  TrendingUp, 
  Award, 
  BarChart2, 
  Calendar, 
  Briefcase, 
  ShieldCheck, 
  BookOpen, 
  Database, 
  Download, 
  Eye, 
  Activity 
} from 'lucide-react';

const ResearchMetrics = ({ metrics }) => {
  const items = [
    { label: 'Publications', value: metrics?.publicationsCount || 0, icon: FileText, color: 'text-blue-500 bg-blue-50' },
    { label: 'Citations', value: metrics?.totalCitations || 0, icon: TrendingUp, color: 'text-indigo-500 bg-indigo-50' },
    { label: 'h-index', value: metrics?.hIndex || 0, icon: Award, color: 'text-orange-500 bg-orange-50' },
    { label: 'i10-index', value: metrics?.i10Index || 0, icon: BarChart2, color: 'text-emerald-500 bg-emerald-50' },
    { label: 'Experience (Years)', value: metrics?.researchExperience || 0, icon: Calendar, color: 'text-purple-500 bg-purple-50' },
    { label: 'Projects', value: metrics?.projectsCount || 0, icon: Briefcase, color: 'text-pink-500 bg-pink-50' },
    { label: 'Patents', value: metrics?.patentsCount || 0, icon: ShieldCheck, color: 'text-teal-500 bg-teal-50' },
    { label: 'Books', value: metrics?.booksCount || 0, icon: BookOpen, color: 'text-red-500 bg-red-50' },
    { label: 'Datasets', value: metrics?.datasetsCount || 0, icon: Database, color: 'text-yellow-500 bg-yellow-50' },
    { label: 'Downloads', value: metrics?.downloadsCount || 0, icon: Download, color: 'text-cyan-500 bg-cyan-50' },
    { label: 'Views', value: metrics?.viewsCount || 0, icon: Eye, color: 'text-rose-500 bg-rose-50' },
    { label: 'Research Score', value: metrics?.researchScore || 0, icon: Activity, color: 'text-violet-500 bg-violet-50' }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary">
                {item.label}
              </span>
              <div className={`p-2 rounded-xl flex-shrink-0 ${item.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
                {item.value}
              </h4>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ResearchMetrics;
