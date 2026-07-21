import React from 'react';
import { Link } from 'react-router-dom';
import { Share2, Twitter, Linkedin, Mail, Github, ArrowRight } from 'lucide-react';

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
];

const footerLinks = {
  Platform: [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#' },
    { label: 'Changelog', href: '#' },
    { label: 'API Documentation', href: '#' },
  ],
  Research: [
    { label: 'Search Papers', href: '/search' },
    { label: 'Researcher Directory', href: '#researchers' },
    { label: 'Collaborations', href: '#' },
    { label: 'Publication Analytics', href: '#' },
    { label: 'Google Scholar Sync', href: '#' },
  ],
  Company: [
    { label: 'About Us', href: '/about', isRoute: true },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#contact' },
    { label: 'Support', href: '#' },
  ],
};

const Footer = () => {
  return (
    <footer className="bg-[#030712] border-t border-white/5 relative overflow-hidden">
      {/* Top accent */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      {/* Newsletter bar */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Stay ahead in research</h3>
              <p className="text-slate-400 text-sm">Get weekly research trends and platform updates.</p>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex items-center gap-2 w-full md:w-auto"
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full md:w-64 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
              />
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all flex-shrink-0"
              >
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Share2 className="w-[18px] h-[18px] text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                Research<span className="text-indigo-400">Connect</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xs">
              Enterprise-grade AI-powered Research Discovery & Collaboration Platform. Built for the world's leading researchers.
            </p>
            <div className="flex items-center gap-4">
              {[
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' },
                { icon: Github, href: '#', label: 'GitHub' },
                { icon: Mail, href: '#', label: 'Email' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg glass-card border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 transition-all group"
                >
                  <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-5">{section}</h4>
              <ul className="space-y-3">
                {links.map(({ label, href, isRoute }) => (
                  <li key={label}>
                    {isRoute ? (
                      <Link
                        to={href}
                        className="text-slate-400 text-sm hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                      >
                        {label}
                      </Link>
                    ) : (
                      <a
                        href={href}
                        className="text-slate-400 text-sm hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                      >
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} Research Connect. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {legalLinks.map(({ label, href }) => (
              <Link key={label} to={href} className="text-slate-500 text-xs hover:text-slate-300 transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;