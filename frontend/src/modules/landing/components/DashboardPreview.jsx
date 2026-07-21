import React from 'react';
import { motion } from 'framer-motion';
import { Layout, TrendingUp, Sparkles, Star, Eye, Award } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'Jan', citations: 400 },
  { name: 'Feb', citations: 300 },
  { name: 'Mar', citations: 550 },
  { name: 'Apr', citations: 480 },
  { name: 'May', citations: 700 },
  { name: 'Jun', citations: 850 },
];

const DashboardPreview = () => {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Powerful Analytics Dashboard</h2>
          <p className="text-slate-600 text-lg">Track your research impact, citations, and collaborations in real-time.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Dashboard Mockup */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden relative z-10">
            {/* Header */}
            <div className="h-14 border-b border-slate-100 flex items-center px-6 gap-6 bg-slate-50/50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 max-w-md mx-auto bg-white border border-slate-200 h-8 rounded-md flex items-center px-3">
                <span className="text-slate-400 text-xs">researchconnect.com/dashboard</span>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 grid md:grid-cols-3 gap-6">
              
              {/* Sidebar stats */}
              <div className="space-y-4">
                {[
                  { label: 'Total Citations', value: '4,205', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { label: 'Profile Views', value: '12.4K', icon: Eye, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: 'h-index', value: '18', icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs font-medium mb-0.5">{stat.label}</p>
                      <p className="text-slate-900 font-bold text-xl">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Main chart */}
              <div className="md:col-span-2 bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-slate-900 font-bold">Citation Growth</h3>
                  <select className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg px-2 py-1 outline-none">
                    <option>Last 6 Months</option>
                  </select>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCitations" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="citations" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorCitations)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-100 rounded-full blur-2xl z-0" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-100 rounded-full blur-2xl z-0" />
        </motion.div>
      </div>
    </section>
  );
};

export default DashboardPreview;
