import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const pages = [];

  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="mt-6 flex items-center justify-center gap-2">

      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
      >
        <ChevronLeft size={16} />
        Previous
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`h-10 w-10 rounded-lg text-sm font-medium transition ${
            currentPage === page
              ? "bg-blue-600 text-white"
              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
      >
        Next
        <ChevronRight size={16} />
      </button>

    </div>
  );
}