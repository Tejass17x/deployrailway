import React from "react";
import { Filter, ChevronDown } from "lucide-react";

export default function FilterDropdown({
  value,
  onChange,
}) {
  return (
    <div className="relative">
      <Filter
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
      >
        <option value="all">All Projects</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="archived">Archived</option>
        <option value="open">Open for Collaboration</option>
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}