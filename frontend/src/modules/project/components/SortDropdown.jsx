import React from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";

export default function SortDropdown({
  value,
  onChange,
}) {
  return (
    <div className="relative">
      <ArrowUpDown
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="deadline">Deadline</option>
        <option value="members">Most Members</option>
        <option value="az">A-Z</option>
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}