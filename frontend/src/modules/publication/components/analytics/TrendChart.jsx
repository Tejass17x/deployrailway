import React from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, Legend
} from 'recharts';

const CustomTooltip = ({ active, payload, label, valueLabel }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-gray-600">{entry.name || valueLabel}:</span>
          <span className="font-bold text-gray-900">{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

const TrendChart = ({
  data = [],
  type = 'area',       // area | line | bar
  dataKey = 'value',
  xKey = 'date',
  color = '#2563EB',
  label = 'Value',
  height = 200,
  showGrid = true,
  showLegend = false,
  formatX,
  formatY,
  emptyMessage = 'No data available for this period.',
  gradient = true,
  series,              // Array of {key, color, label} for multi-series
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">
        <p className="text-sm text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  // Format X axis labels (date → 'Jul 1', etc.)
  const defaultFormatX = (val) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
    } catch { return val; }
  };

  const xFormatter = formatX || defaultFormatX;
  const yFormatter = formatY || ((v) => v?.toLocaleString?.() ?? v);

  const gradientId = `gradient-${dataKey}-${color.replace('#', '')}`;

  const chartProps = {
    data,
    margin: { top: 5, right: 5, left: -10, bottom: 0 },
  };

  const axisStyle = { fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter, sans-serif' };

  const renderChart = () => {
    if (type === 'bar') {
      return (
        <BarChart {...chartProps}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />}
          <XAxis dataKey={xKey} tickFormatter={xFormatter} tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={yFormatter} tick={axisStyle} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<CustomTooltip valueLabel={label} />} />
          {showLegend && <Legend />}
          {series ? series.map(s => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
          )) : (
            <Bar dataKey={dataKey} name={label} fill={color} radius={[4, 4, 0, 0]} />
          )}
        </BarChart>
      );
    }

    if (type === 'area') {
      return (
        <AreaChart {...chartProps}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />}
          <XAxis dataKey={xKey} tickFormatter={xFormatter} tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={yFormatter} tick={axisStyle} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<CustomTooltip valueLabel={label} />} />
          {showLegend && <Legend />}
          {series ? series.map(s => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} fill={`url(#gradient-${s.key})`} strokeWidth={2} dot={false} />
          )) : (
            <Area type="monotone" dataKey={dataKey} name={label} stroke={color} fill={gradient ? `url(#${gradientId})` : 'none'} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: color }} />
          )}
        </AreaChart>
      );
    }

    // Line chart (default)
    return (
      <LineChart {...chartProps}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />}
        <XAxis dataKey={xKey} tickFormatter={xFormatter} tick={axisStyle} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={yFormatter} tick={axisStyle} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<CustomTooltip valueLabel={label} />} />
        {showLegend && <Legend />}
        {series ? series.map(s => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} />
        )) : (
          <Line type="monotone" dataKey={dataKey} name={label} stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: color }} />
        )}
      </LineChart>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      {renderChart()}
    </ResponsiveContainer>
  );
};

export default TrendChart;
