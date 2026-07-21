import React from 'react';

const institutions = [
  'Stanford University', 'MIT', 'Oxford', 'Cambridge', 'Harvard University',
  'Caltech', 'ETH Zurich', 'IIT Bombay', 'IISc Bangalore', 'IIT Delhi',
  'Yale University', 'Princeton University', 'Imperial College London',
  'University of Tokyo', 'National University of Singapore', 'Tsinghua University',
  'AIIMS Delhi', 'University of Toronto', 'TIFR', 'IIT Kanpur', 'IIT Madras',
];

const TrustedBy = () => {
  // Duplicate list for seamless infinite loop
  const repeated = [...institutions, ...institutions];

  return (
    <section className="py-12 bg-slate-50 border-y border-slate-200 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-8">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
          Trusted by researchers at leading institutions worldwide
        </p>
      </div>

      {/* Marquee track */}
      <div className="relative w-full overflow-hidden">
        <div
          className="flex w-max"
          style={{
            animation: 'marquee-scroll 40s linear infinite',
          }}
        >
          {repeated.map((uni, idx) => (
            <span
              key={idx}
              className="text-xl font-bold text-slate-300 whitespace-nowrap opacity-80 hover:opacity-100 hover:text-slate-700 transition-all cursor-default mx-10"
            >
              {uni}
            </span>
          ))}
        </div>
      </div>

      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10" />

      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
};

export default TrustedBy;
