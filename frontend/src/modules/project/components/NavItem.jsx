import React from "react";

export default function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      <Icon size={18} strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
}