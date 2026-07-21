import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Share2, LogIn, UserPlus } from 'lucide-react';

const LandingNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <>
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:shadow-blue-600/40 transition-all">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                Research<span className="text-blue-600">Connect</span>
              </span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex flex-1 justify-center">
              <div className="flex items-center gap-8">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                Sign In
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                <Link to="/register" className="text-sm font-semibold text-white bg-blue-600 px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-600/10 inline-block">
                  Create Account
                </Link>
              </motion.div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-slate-600 hover:text-blue-600 focus:outline-none p-2"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-20 bg-white border-b border-slate-200 z-40 md:hidden shadow-xl"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-3 text-base font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 mt-2 border-t border-slate-100 flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-base font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-base font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700"
                >
                  <UserPlus className="w-5 h-5" />
                  Get Started Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNavbar;
