import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Menu, X, ChevronDown } from 'lucide-react';
import Button from '../ui/Button';

const LandingNavbar = ({ config, onOpenLegal, onOpenContact }) => {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-500">
            <img src="/logo.svg" className="h-8 w-8" alt="HDM" />
            {config?.systemName || 'HDM ERP'}
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500">Pricing</a>

            {/* About Dropdown */}
            <div className="relative" onMouseEnter={() => setAboutOpen(true)} onMouseLeave={() => setAboutOpen(false)}>
              <button className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500">
                About <ChevronDown size={14} />
              </button>
              {aboutOpen && (
                <div className="absolute top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                  <a href="#about" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Our Story</a>
                  <button onClick={() => onOpenLegal('privacy_policy')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Privacy</button>
                  <button onClick={() => onOpenLegal('terms_of_service')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Terms</button>
                </div>
              )}
            </div>

            {/* Support Dropdown */}
            <div className="relative" onMouseEnter={() => setSupportOpen(true)} onMouseLeave={() => setSupportOpen(false)}>
              <button className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500">
                Support <ChevronDown size={14} />
              </button>
              {supportOpen && (
                <div className="absolute top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                  <button onClick={onOpenContact} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Contact Us</button>
                  <a href="#faq" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">FAQs</a>
                  <a href="#help" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Help Center</a>
                </div>
              )}
            </div>

            <Button variant="ghost" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Link to="/login"><Button variant="outline">Login</Button></Link>
            <Link to="/register"><Button>Get Started</Button></Link>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <a href="#features" className="block py-2 text-sm text-gray-600 dark:text-gray-300" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#pricing" className="block py-2 text-sm text-gray-600 dark:text-gray-300" onClick={() => setMobileOpen(false)}>Pricing</a>
          <a href="#about" className="block py-2 text-sm text-gray-600 dark:text-gray-300" onClick={() => setMobileOpen(false)}>About</a>
          <button onClick={() => { onOpenLegal('privacy_policy'); setMobileOpen(false); }} className="block w-full text-left py-2 text-sm text-gray-600 dark:text-gray-300">Privacy</button>
          <button onClick={() => { onOpenLegal('terms_of_service'); setMobileOpen(false); }} className="block w-full text-left py-2 text-sm text-gray-600 dark:text-gray-300">Terms</button>
          <button onClick={() => { onOpenContact(); setMobileOpen(false); }} className="block w-full text-left py-2 text-sm text-gray-600 dark:text-gray-300">Contact</button>
          <a href="#faq" className="block py-2 text-sm text-gray-600 dark:text-gray-300" onClick={() => setMobileOpen(false)}>FAQs</a>
          <a href="#help" className="block py-2 text-sm text-gray-600 dark:text-gray-300" onClick={() => setMobileOpen(false)}>Help</a>
          <div className="pt-2 space-y-2">
            <Link to="/login" className="block w-full"><Button variant="outline" className="w-full">Login</Button></Link>
            <Link to="/register" className="block w-full"><Button className="w-full">Get Started</Button></Link>
          </div>
        </div>
      )}
    </nav>
  );
};
export default LandingNavbar;