import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricSummaryCard = ({ icon: Icon, label, value, color = 'blue', trend, trendLabel, index = 0, format = 'number' }) => {
  const colorMap = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   badge: 'bg-blue-100',   border: 'border-blue-200' },
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  badge: 'bg-green-100',  border: 'border-green-200' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', badge: 'bg-purple-100', border: 'border-purple-200' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', badge: 'bg-orange-100', border: 'border-orange-200' },
    teal:   { bg: 'bg-teal-50',   icon: 'text-teal-600',   badge: 'bg-teal-100',   border: 'border-teal-200' },
    rose:   { bg: 'bg-rose-50',   icon: 'text-rose-600',   badge: 'bg-rose-100',   border: 'border-rose-200' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  badge: 'bg-amber-100',  border: 'border-amber-200' },
    gray:   { bg: 'bg-gray-50',   icon: 'text-gray-600',   badge: 'bg-gray-100',   border: 'border-gray-200' },
  };

  const c = colorMap[color] || colorMap.blue;

  const formatValue = (v) => {
    if (v === undefined || v === null) return '—';
    if (format === 'number') return Number(v).toLocaleString();
    if (format === 'decimal') return Number(v).toFixed(1);
    if (format === 'percent') return `${Number(v).toFixed(1)}%`;
    return v;
  };

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-emerald-600 bg-emerald-50' : trend < 0 ? 'text-rose-600 bg-rose-50' : 'text-gray-500 bg-gray-100';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-2xl ${c.bg} flex items-center justify-center border ${c.border}`}>
          {Icon && <Icon className={`w-5 h-5 ${c.icon}`} />}
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatValue(value)}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
        {trendLabel && <p className="text-xs text-gray-400 mt-0.5">{trendLabel}</p>}
      </div>
    </motion.div>
  );
};

export default MetricSummaryCard;
