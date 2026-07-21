import React from "react";

// Simple conic-gradient donut built purely in CSS — no chart library needed.
export default function DonutChart() {
  const segments = [
    { color: "#10b981", pct: 50 }, // active green
    { color: "#3b82f6", pct: 25 }, // active blue
    { color: "#9ca3af", pct: 12.5 }, // completed gray
    { color: "#8b5cf6", pct: 12.5 }, // archived violet
  ];
  let acc = 0;
  const stops = segments
    .map((s) => {
      const start = acc;
      acc += s.pct;
      return `${s.color} ${start}% ${acc}%`;
    })
    .join(", ");

  return (
    <div
      className="relative h-32 w-32 rounded-full"
      style={{ background: `conic-gradient(${stops})` }}
    >
      <div className="absolute inset-3 rounded-full bg-white" />
    </div>
  );
}