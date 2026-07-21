import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#2563EB', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2', '#BE185D', '#15803D'];

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-800">{name}</p>
      <p className="text-gray-600">{Number(value).toLocaleString()} visits</p>
    </div>
  );
};

const TrafficSourcesChart = ({ data = [], height = 240 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-200">
        <p className="text-sm text-gray-400">No traffic data available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={height / 2 - 10}
            innerRadius={height / 4}
            dataKey="value"
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {data.map((item, i) => {
          const total = data.reduce((sum, d) => sum + d.value, 0);
          const pct = total ? ((item.value / total) * 100).toFixed(1) : '0';
          return (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-xs text-gray-600 truncate">{item.name}</span>
              <span className="text-xs font-semibold text-gray-900 ml-auto">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrafficSourcesChart;
