import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';
import imgMeet from '../../../assets/researchers-meeting.jpg';

const CTA = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-blue-600 rounded-3xl overflow-hidden shadow-2xl relative">
          <div className="grid lg:grid-cols-2">
            
            {/* Left Content */}
            <div className="p-10 md:p-16 lg:p-20 flex flex-col justify-center relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Ready to accelerate your research?
              </h2>
              <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-xl leading-relaxed">
                Join thousands of researchers worldwide who are already using our platform to discover, collaborate, and innovate.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <motion.button
                    whileHover={{ scale: 1.06, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                  >
                    Create Free Account <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                <Link to="/about">
                  <motion.button
                    whileHover={{ scale: 1.06, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="w-full sm:w-auto px-8 py-4 bg-blue-700 text-white rounded-xl font-bold shadow-lg border border-blue-500"
                  >
                    Learn More
                  </motion.button>
                </Link>
              </div>
            </div>

            {/* Right Image */}
            <div className="hidden lg:block relative min-h-[400px] group overflow-hidden">
              <img 
                src={imgMeet} 
                alt="Researchers meeting" 
                className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-transparent w-48 z-10" />
              <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 pointer-events-none" />
              
              <motion.div 
                animate={{ 
                  opacity: [0.2, 0.5, 0.2],
                  scale: [1, 1.2, 1]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-blue-400 rounded-full blur-[80px] pointer-events-none z-0" 
              />
            </div>

          </div>
          
          {/* Decorative background elements for small screens */}
          <div className="lg:hidden absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="lg:hidden absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-blue-700 rounded-full blur-3xl opacity-50 pointer-events-none" />
        </div>
      </div>
    </section>
  );
};

export default CTA;
