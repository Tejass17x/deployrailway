import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Globe2 } from 'lucide-react';
import { TypeAnimation } from 'react-type-animation';

import img1 from '../../../assets/researcher-lab.jpg';
import imgMicroscope from '../../../assets/researcher-microscope.jpg';
import imgChalkboard from '../../../assets/researcher-chalkboard.jpg';

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] bg-white overflow-hidden pt-20 border-b border-slate-200">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-16 lg:pt-24 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0"
          >
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
              Connect. Collaborate.{' '}
              <br className="hidden sm:block" />
              <TypeAnimation
                sequence={[
                  'Discover.', 2500,
                  'Innovate.', 2500,
                  'Research.', 2500,
                  'Publish.', 2500,
                  'Grow.', 2500,
                ]}
                wrapper="span"
                cursor={true}
                repeat={Infinity}
                className="inline-block text-blue-600"
              />
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-600 mb-10 leading-relaxed">
              The world's leading network for academics and researchers. Find collaborators, secure funding, and advance human knowledge together.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/register">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Join the Network
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link to="/explore">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="px-8 py-4 bg-white text-slate-700 font-bold border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  Explore Research
                </motion.button>
              </Link>
            </div>
            
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Free for academics
              </div>
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-blue-500" />
                Global community
              </div>
            </div>
          </motion.div>

          {/* Right: Award-Winning Multi-Image Hero */}
          <div className="hidden lg:flex relative h-[600px] w-full items-center justify-center">
            
            {/* Animated Background Glow */}
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
                rotate: [0, 90, 0]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full blur-3xl -z-10 pointer-events-none" 
            />

            {/* Main large image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                opacity: { duration: 1, delay: 0.2 },
                scale: { duration: 1, delay: 0.2, type: "spring", bounce: 0.4 },
                y: { duration: 1, delay: 0.2, type: "spring", bounce: 0.4 }
              }}
              className="relative w-full max-w-[420px] h-[520px] rounded-[2rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(37,99,235,0.3)] border-8 border-white z-20 ml-12 group"
            >
              <img src={img1} alt="Researcher in lab" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
            </motion.div>

            {/* Top left floating image */}
            <motion.div 
              initial={{ x: -60, opacity: 0, rotate: -20 }}
              animate={{ x: 0, opacity: 1, rotate: -6 }}
              transition={{ 
                opacity: { duration: 0.8, delay: 0.6 },
                x: { duration: 0.8, delay: 0.6, type: "spring", bounce: 0.5 },
                rotate: { duration: 0.8, delay: 0.6, type: "spring", bounce: 0.5 }
              }}
              className="absolute top-8 left-0 w-56 h-48 rounded-3xl overflow-hidden shadow-2xl border-4 border-white z-30 group"
            >
              <img src={imgMicroscope} alt="Researcher at microscope" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>

            {/* Bottom right floating image */}
            <motion.div 
              initial={{ x: 60, opacity: 0, rotate: 20 }}
              animate={{ x: 0, opacity: 1, rotate: 3 }}
              transition={{ 
                opacity: { duration: 0.8, delay: 0.8 },
                x: { duration: 0.8, delay: 0.8, type: "spring", bounce: 0.5 },
                rotate: { duration: 0.8, delay: 0.8, type: "spring", bounce: 0.5 }
              }}
              className="absolute bottom-4 -right-4 w-64 h-56 rounded-3xl overflow-hidden shadow-2xl border-4 border-white z-30 group"
            >
              <img src={imgChalkboard} alt="Researcher at chalkboard" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
            
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
