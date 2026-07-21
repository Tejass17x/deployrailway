import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Database, MessageSquare, Zap, Target, Lock, ArrowRight, Layers, Box, Code } from 'lucide-react';

const featuresList = [
  {
    id: 'network',
    icon: Network,
    title: 'Global Research Network',
    desc: 'Connect with peers across 50+ countries. Find collaborators matching your exact research interests using AI-driven matching algorithms.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  {
    id: 'publications',
    icon: Database,
    title: 'Smart Library & Discovery',
    desc: 'Organize your references and discover new papers. Get personalized recommendations based on your reading history and citations.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200'
  },
  {
    id: 'collaboration',
    icon: MessageSquare,
    title: 'Real-time Workspaces',
    desc: 'Collaborate on drafts, share datasets securely, and communicate with co-authors in dedicated project channels.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200'
  }
];

import imgTablet from '../../../assets/researchers-tablet.jpg';

const Features = () => {
  return (
    <section id="features" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Everything you need to advance your research
          </h2>
          <p className="text-slate-600 text-lg">
            A comprehensive suite of tools designed specifically for modern researchers.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div>
            <div className="grid gap-6">
              {featuresList.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, x: -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02, x: 8 }}
                  viewport={{ once: true }}
                  transition={{ 
                    opacity: { duration: 0.5, delay: index * 0.15 },
                    x: { duration: 0.5, delay: index * 0.15, type: 'spring', bounce: 0.4 },
                    scale: { type: 'spring', bounce: 0.5 },
                  }}
                  className="flex gap-6 p-6 rounded-2xl hover:bg-white transition-all group cursor-default shadow-sm hover:shadow-xl border border-transparent hover:border-slate-100 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <div className="flex-shrink-0 relative z-10">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                      <feature.icon className="w-7 h-7" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed mb-4">
                      {feature.desc}
                    </p>
                    <a href="#" className={`inline-flex items-center text-sm font-semibold ${feature.color} group-hover:underline`}>
                      Learn more <ArrowRight className="w-4 h-4 ml-1" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right: Floating Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ 
              opacity: { duration: 0.8 },
              scale: { duration: 0.8, type: 'spring', bounce: 0.4 },
              rotate: { duration: 0.8, type: 'spring', bounce: 0.4 }
            }}
            viewport={{ once: true }}
            className="hidden lg:block relative h-[600px] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-8 border-white group"
          >
            <img src={imgTablet} alt="Researchers with tablet" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Features;
