import React from 'react';
import { motion } from 'framer-motion';

const Companies = () => {
  const organizations = [
    { name: 'Stanford University', logo: '🌲 Stanford' },
    { name: 'Harvard University', logo: '🏛️ Harvard' },
    { name: 'MIT', logo: '⚙️ MIT' },
    { name: 'Google Research', logo: '🔍 Google' },
    { name: 'Meta AI', logo: '♾️ Meta' },
    { name: 'CERN', logo: '⚛️ CERN' },
    { name: 'Oxford University', logo: '🎓 Oxford' },
    { name: 'NASA', logo: '🚀 NASA' }
  ];

  // Duplicate the array to create a seamless infinite loop
  const infiniteOrgs = [...organizations, ...organizations];

  return (
    <section className="py-12 bg-bg-card border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          Trusted by Researchers at Leading Institutions
        </h2>
      </div>

      <div className="relative w-full flex items-center">
        {/* Left & Right Fades for premium presentation */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-bg-card to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-bg-card to-transparent z-10 pointer-events-none" />

        {/* Infinite Slider */}
        <motion.div
          className="flex gap-12 whitespace-nowrap min-w-max"
          animate={{ x: [0, -1000] }}
          transition={{
            ease: 'linear',
            duration: 25,
            repeat: Infinity
          }}
        >
          {infiniteOrgs.map((org, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 text-text-secondary font-bold text-lg px-6 py-2 rounded-full bg-bg-page border border-border hover:text-primary hover:border-primary transition-colors cursor-default"
            >
              <span>{org.logo}</span>
              <span>{org.name}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Companies;
