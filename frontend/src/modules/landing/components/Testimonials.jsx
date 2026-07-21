import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Dr. Sarah Chen',
    role: 'Lead Researcher, Stanford',
    image: 'SC',
    quote: 'Research Connect has completely transformed how our lab discovers relevant literature. The AI matching is incredibly accurate, saving us hours of manual searching.'
  },
  {
    id: 2,
    name: 'Prof. James Kim',
    role: 'Director of AI, MIT',
    image: 'JK',
    quote: 'The collaborative workspaces are a game-changer. We can now securely share datasets and drafts with our international partners seamlessly.'
  },
  {
    id: 3,
    name: 'Elena Rodriguez',
    role: 'PhD Candidate, Oxford',
    image: 'ER',
    quote: 'Finding mentors and peers in my highly specialized niche used to be impossible. This platform connected me with experts I wouldn\'t have found otherwise.'
  }
];

import img5 from '../../../assets/researcher-field.jpg';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((i) => (i + 1) % testimonials.length);
  const prev = () => setCurrentIndex((i) => (i - 1 + testimonials.length) % testimonials.length);

  return (
    <section id="testimonials" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Text / Carousel */}
          <div>
            <div className="mb-12">
              <h2 className="text-4xl font-bold text-slate-900 mb-4">Loved by researchers worldwide</h2>
              <p className="text-slate-600 text-lg">See what our community has to say about the platform.</p>
            </div>

            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-10 shadow-sm"
                >
                  <Quote className="w-10 h-10 text-blue-200 mb-6" />
                  <p className="text-lg md:text-xl font-medium text-slate-700 mb-8 leading-relaxed">
                    "{testimonials[currentIndex].quote}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl border-2 border-white shadow-md flex-shrink-0">
                      {testimonials[currentIndex].image}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{testimonials[currentIndex].name}</h4>
                      <p className="text-sm text-slate-500">{testimonials[currentIndex].role}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex gap-3 mt-8">
                <motion.button
                  onClick={prev}
                  whileHover={{ scale: 1.15, backgroundColor: '#eff6ff', borderColor: '#93c5fd' }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.button>
                <motion.button
                  onClick={next}
                  whileHover={{ scale: 1.15, backgroundColor: '#2563eb', color: '#ffffff' }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Right Parallax Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ 
              opacity: { duration: 0.8 },
              scale: { duration: 0.8, type: 'spring', bounce: 0.4 },
              rotate: { duration: 0.8, type: 'spring', bounce: 0.4 }
            }}
            viewport={{ once: true }}
            className="relative h-[600px] hidden lg:block rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-8 border-white group"
          >
            <img src={img5} alt="Researcher in field" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" />
            
            {/* Parallax elements */}
            <div 
              className="absolute bottom-10 left-10 right-10 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                </div>
                <div>
                  <div className="text-white font-bold text-lg">4.9/5 Average Rating</div>
                  <div className="text-white/80 text-sm">From 1,400+ researchers</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
