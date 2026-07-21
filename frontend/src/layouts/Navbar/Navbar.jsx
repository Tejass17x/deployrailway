import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleMobileMenu, closeMobileMenu } from '../../redux/slices/appSlice';
import { Menu, X, Share2 } from 'lucide-react';
import Button from '../../components/common/buttons/Button';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isMobileMenuOpen } = useSelector((state) => state.app);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/#features' },
    { name: 'Researchers', path: '/#researchers' },
    { name: 'About', path: '/#about' },
    { name: 'Contact', path: '/#contact' }
  ];

  const handleLogoClick = () => {
    dispatch(closeMobileMenu());
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 glass-nav shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" onClick={handleLogoClick} className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-gradient-primary text-white flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </span>
              <span className="font-bold text-xl tracking-tight text-text-primary">
                Research<span className="text-primary">Connect</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav links */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                className="text-sm font-medium text-text-secondary hover:text-primary transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Action buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button variant="primary" onClick={() => navigate('/register')}>
              Register
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => dispatch(toggleMobileMenu())}
              className="text-text-secondary hover:text-text-primary focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass-nav border-t border-border py-4 px-6 space-y-4 shadow-inner">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                onClick={() => dispatch(closeMobileMenu())}
                className="text-base font-medium text-text-secondary hover:text-primary transition-colors py-2"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="border-t border-border pt-4 flex flex-col gap-3">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                dispatch(closeMobileMenu());
                navigate('/login');
              }}
            >
              Login
            </Button>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => {
                dispatch(closeMobileMenu());
                navigate('/register');
              }}
            >
              Register
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
