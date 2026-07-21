import React, { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../api/axiosInstance';
import { Users, BookOpenCheck, Globe, Handshake, Award, TrendingUp } from 'lucide-react';

const stats = [
  { key: 'researchers', label: 'Registered Researchers', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', fallback: 1422, suffix: '+', description: 'Active globally' },
  { key: 'publications', label: 'Indexed Publications', icon: BookOpenCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', fallback: 18450, suffix: '+', description: 'Peer-reviewed works' },
  { key: 'countries', label: 'Represented Countries', icon: Globe, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', fallback: 54, suffix: '', description: 'Worldwide reach' },
  { key: 'universities', label: 'Partner Institutions', icon: Award, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', fallback: 116, suffix: '+', description: 'Top universities' },
];

const AnimatedCounter = ({ value, suffix = '', duration = 2 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (inView && !hasAnimated.current && ref.current) {
      hasAnimated.current = true;
      let startTimestamp = null;
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const currentVal = progress === 1 ? value : Math.floor(easeProgress * value);
        if (ref.current) {
          ref.current.textContent = currentVal.toLocaleString() + suffix;
        }
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [inView, value, suffix, duration]);

  return <span ref={ref}>0{suffix}</span>;
};

const Stats = () => {
  const { data } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const res = await axiosInstance.get('/stats');
      return res.data?.data || res.data;
    },
    retry: false,
  });

  return (
    <section className="py-24 bg-white relative overflow-hidden border-b border-slate-200">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            The numbers speak for themselves
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Join a thriving global research community driving scientific discovery forward.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const rawValue = data?.[`${stat.key}Count`] ?? data?.[stat.key] ?? stat.fallback;
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.03, y: -4 }}
                className={`bg-white rounded-2xl p-6 lg:p-8 border ${stat.border} shadow-sm group cursor-default relative overflow-hidden`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${stat.bg} -mr-16 -mt-16`} />
                <div className={`w-12 h-12 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center mb-5 relative z-10`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`text-4xl lg:text-5xl font-extrabold ${stat.color} mb-2 tracking-tight relative z-10`}>
                  <AnimatedCounter value={rawValue} suffix={stat.suffix} />
                </div>
                <p className="text-slate-900 font-bold text-sm mb-1 relative z-10">{stat.label}</p>
                <p className="text-slate-500 text-xs relative z-10">{stat.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Stats;
