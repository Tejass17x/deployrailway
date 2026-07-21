import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Upload, Search, Handshake } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Create Your Profile',
    desc: 'Join the platform and set up your research identity in minutes.',
    icon: UserPlus
  },
  {
    number: '02',
    title: 'Add Publications',
    desc: 'Sync with Google Scholar or upload your papers directly.',
    icon: Upload
  },
  {
    number: '03',
    title: 'Discover Peers',
    desc: 'Use AI to find researchers matching your specific interests.',
    icon: Search
  },
  {
    number: '04',
    title: 'Collaborate',
    desc: 'Start workspaces and collaborate securely in real-time.',
    icon: Handshake
  }
];

import img4 from '../../../assets/researcher-conference.jpg';

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">How it works</h2>
          <p className="text-lg text-slate-600">Get started in four simple steps</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Floating Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ 
              opacity: { duration: 0.8 },
              scale: { duration: 0.8, type: 'spring', bounce: 0.4 },
              rotate: { duration: 0.8, type: 'spring', bounce: 0.4 }
            }}
            viewport={{ once: true }}
            className="hidden lg:block relative h-[600px] rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-8 border-white group"
          >
            <img src={img4} alt="Researchers collaborating" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />
          </motion.div>

          {/* Right: Steps */}
          <div>
            <div className="grid gap-6">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02, x: -8 }}
                  viewport={{ once: true }}
                  transition={{ 
                    opacity: { duration: 0.5, delay: index * 0.15 },
                    x: { duration: 0.5, delay: index * 0.15, type: 'spring', bounce: 0.4 },
                    scale: { type: 'spring', bounce: 0.5 },
                  }}
                  className="flex gap-6 p-6 rounded-2xl hover:bg-slate-50 transition-colors group cursor-default shadow-sm hover:shadow-xl border border-transparent hover:border-slate-100 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-blue-50/30 to-transparent translate-x-[100%] group-hover:translate-x-[-100%] transition-transform duration-1000" />
                  
                  <div className="flex-shrink-0 relative z-10">
                    <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 relative shadow-inner">
                      {step.number}
                      <div className="absolute inset-0 rounded-full border-2 border-blue-600 opacity-0 group-hover:animate-ping" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
