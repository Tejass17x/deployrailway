import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Star, Eye, Share2, Award, ArrowUpRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const publications = [
  {
    id: 1,
    title: 'Attention Is All You Need',
    authors: 'Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L.',
    journal: 'NeurIPS 2017',
    citations: '120K+',
    reads: '500K+',
    tags: ['Deep Learning', 'NLP', 'Transformers']
  },
  {
    id: 2,
    title: 'AlphaFold: Highly accurate protein structure prediction',
    authors: 'Jumper, J., Evans, R., Pritzel, A., Green, T.',
    journal: 'Nature 2021',
    citations: '25K+',
    reads: '150K+',
    tags: ['Bioinformatics', 'Protein Folding', 'AI']
  },
  {
    id: 3,
    title: 'Generative Adversarial Nets',
    authors: 'Goodfellow, I., Pouget-Abadie, J., Mirza, M.',
    journal: 'NeurIPS 2014',
    citations: '60K+',
    reads: '300K+',
    tags: ['Generative AI', 'GANs', 'Machine Learning']
  }
];

const PublicationShowcase = () => {
  const navigate = useNavigate();
  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="mb-12 md:mb-0">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Share and discover breakthrough research</h2>
            <p className="text-slate-600 text-lg">Explore the most impactful research papers curated by our AI from across the globe.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/register')}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-900 border border-slate-200 font-bold rounded-xl hover:bg-slate-100 transition-colors"
          >
            View All Papers
            <ArrowUpRight className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {publications.map((pub, index) => (
            <motion.div
              key={pub.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, y: -5 }}
              viewport={{ once: true }}
              transition={{ 
                opacity: { duration: 0.5, delay: index * 0.15 },
                y: { duration: 0.5, delay: index * 0.15, type: 'spring', bounce: 0.4 },
                scale: { type: 'spring', bounce: 0.5 },
              }}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-x-full group-hover:translate-x-0 ease-out" />
              
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <motion.button
                  whileHover={{ scale: 1.2, color: '#2563eb' }}
                  whileTap={{ scale: 0.9 }}
                  className="text-slate-400 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </motion.button>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">
                {pub.title}
              </h3>
              <p className="text-slate-500 text-sm mb-4 line-clamp-2">{pub.authors}</p>
              
              <div className="flex items-center justify-between py-4 border-y border-slate-100 mb-4">
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-500" /> {pub.journal}</div>
                  <div className="flex items-center gap-1.5"><Star className="w-4 h-4" /> {pub.citations}</div>
                  <div className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {pub.reads}</div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {pub.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PublicationShowcase;
