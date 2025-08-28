import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play, User, LogOut, Settings } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar when at top of page
      if (currentScrollY < 10) {
        setIsVisible(true);
      }
      // Hide navbar when scrolling down, show when scrolling up
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Add scroll event listener
    window.addEventListener('scroll', controlNavbar);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

  // Always show navbar on certain pages
  useEffect(() => {
    const alwaysShowPages = ['/login', '/register', '/admin'];
    const shouldAlwaysShow = alwaysShowPages.some(page => location.pathname.startsWith(page));
    
    if (shouldAlwaysShow) {
      setIsVisible(true);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    
    // If we're already on the home page, force a refresh to reset filters
    if (location.pathname === '/') {
      // Trigger a page refresh to reset all filters and show home sections
      window.location.href = '/';
    } else {
      // Navigate to home page
      navigate('/');
    }
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } bg-card/95 backdrop-blur-sm border-b border-border`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a 
            href="/" 
            onClick={handleLogoClick} 
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors duration-200"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Play className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">StreamFlix</span>
          </a>

          {/* Navigation Menu */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Welcome, {user.name}
                </span>
                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-muted"
                  >
                    <Settings size={18} />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-muted"
                >
                  <LogOut size={18} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  to="/login" 
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-muted"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 px-4 py-2 rounded-lg font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;