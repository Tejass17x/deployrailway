import React from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, UserCheck, Sparkles, Star } from 'lucide-react';

const matches = [
  {
    id: 1,
    name: 'Prof. James Kim',
    role: 'ML Research Lead',
    institution: 'Stanford University',
    match: 94,
    keywords: ['Deep Learning', 'NLP', 'Computer Vision'],
    color: 'from-blue-600 to-indigo-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    text: 'text-blue-700'
  },
  {
    id: 2,
    name: 'Dr. Sarah Chen',
    role: 'Bioinformatics',
    institution: 'MIT',
    match: 88,
    keywords: ['Genomics', 'Data Science', 'Biology'],
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    text: 'text-emerald-700'
  },
  {
    id: 3,
    name: 'Dr. Emily Wang',
    role: 'Quantum Computing',
    institution: 'Caltech',
    match: 91,
    keywords: ['Quantum Algorithms', 'Physics', 'Qubits'],
    color: 'from-violet-600 to-fuchsia-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    text: 'text-violet-700'
  }
];

import img3 from '../../../assets/researcher-homeoffice.jpg';

const AIShowcase = () => {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-bold text-slate-900 leading-tight">
              Find the perfect collaborators instantly
            </h2>
            <p className="text-lg text-slate-600">
              Our advanced AI analyzes your publications, research interests, and methodology to suggest researchers who perfectly complement your work.
            </p>
            <ul className="space-y-4 pt-4">
              {[
                'Analyzes millions of data points',
                'Suggests cross-disciplinary matches',
                'Identifies complimentary skillsets'
              ].map((item, index) => (
                <motion.li 
                  key={index} 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + (index * 0.15), duration: 0.5, type: 'spring', bounce: 0.4 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex items-center gap-3 text-slate-700 font-medium group cursor-default"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="group-hover:text-slate-900 transition-colors">{item}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Right Visuals */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ 
              opacity: { duration: 0.8 },
              scale: { duration: 0.8, type: 'spring', bounce: 0.4 },
              rotate: { duration: 0.8, type: 'spring', bounce: 0.4 }
            }}
            viewport={{ once: true }}
            className="relative h-[500px] group"
          >
            <div className="w-full h-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-4 border-white relative z-10">
              <img src={img3} alt="Researcher at home office" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" />
              
              {/* AI Scanner Effect */}
              <motion.div 
                animate={{ y: ['-10%', '110%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-0 right-0 h-1 bg-blue-400/50 shadow-[0_0_20px_5px_rgba(96,165,250,0.3)] pointer-events-none"
              />
            </div>
            {/* Decorative background circle */}
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-blue-100 rounded-full blur-3xl -z-10" 
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
};

// Simple icon wrapper
const CheckCircle2 = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default AIShowcase;
