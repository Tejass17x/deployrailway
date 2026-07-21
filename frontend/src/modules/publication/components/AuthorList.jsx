import React from 'react';
import { Link } from 'react-router-dom';
import { User, Building2, MailOpen, ExternalLink, Star } from 'lucide-react';

const AuthorList = ({ authors = [], plainAuthorsString = '' }) => {
  if (!authors || authors.length === 0) {
    if (!plainAuthorsString) return null;
    // Fallback: render plain string authors
    return (
      <div className="flex flex-wrap gap-2">
        {plainAuthorsString.split(',').map((name, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            {name.trim()}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {authors.map((author, i) => {
        const isLinked = !!author.authorId || !!author.profileSlug;
        const inner = (
          <span className={`inline-flex items-start gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
            isLinked
              ? 'bg-blue-50 border-blue-100 text-blue-800 hover:bg-blue-100 cursor-pointer'
              : 'bg-slate-50 border-slate-100 text-slate-700'
          }`}>
            {/* Avatar placeholder */}
            <span className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center text-[9px] font-black text-blue-700 flex-shrink-0 mt-0.5">
              {(author.name || '?').charAt(0).toUpperCase()}
            </span>

            <span className="flex flex-col">
              <span className="leading-tight font-bold">
                {author.name}
                {author.isCorresponding && (
                  <Star className="w-2.5 h-2.5 text-amber-500 inline-block ml-1 -mt-0.5" />
                )}
              </span>
              {author.institution && (
                <span className="text-[10px] text-slate-500 font-normal mt-0.5 leading-tight flex items-center gap-1">
                  <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
                  {author.institution}
                </span>
              )}
            </span>
          </span>
        );

        if (isLinked) {
          const slug = author.profileSlug || author.authorId;
          return (
            <Link key={i} to={`/profile/${slug}`}>
              {inner}
            </Link>
          );
        }
        return <span key={i}>{inner}</span>;
      })}
    </div>
  );
};

export default AuthorList;
