import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Heart, Star, Film, Tv, Sparkles } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const handleCategoryClick = (category) => {
    // Navigate to home with category filter
    navigate(`/?category=${category}`);
    
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleHomeClick = () => {
    // Navigate to home and reset filters
    navigate('/');
    
    // Scroll to top after navigation
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-foreground">Streamflix</span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Your ultimate destination for unlimited movies, TV shows, and animated content. 
              Stream anywhere, anytime with high-quality video and audio.
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Film size={16} className="text-primary" />
                <span>10,000+ Movies</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tv size={16} className="text-primary" />
                <span>5,000+ TV Series</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles size={16} className="text-primary" />
                <span>2,000+ Animated</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={handleHomeClick}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-left w-full text-sm"
                >
                  Home
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleCategoryClick('Action')}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-left w-full text-sm"
                >
                  Action Movies
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleCategoryClick('Comedy')}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-left w-full text-sm"
                >
                  Comedy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleCategoryClick('Drama')}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-left w-full text-sm"
                >
                  Drama
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleCategoryClick('Horror')}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-left w-full text-sm"
                >
                  Horror
                </button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Categories</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => handleCategoryClick('Romance')}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-left w-full text-sm"
                >
                  Romance
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleCategoryClick('Thriller')}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-left w-full text-sm"
                >
                  Thriller
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleCategoryClick('Sci-Fi')}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-left w-full text-sm"
                >
                  Sci-Fi
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleCategoryClick('Documentary')}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-left w-full text-sm"
                >
                  Documentary
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleCategoryClick('Animation')}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-left w-full text-sm"
                >
                  Animation
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact & Social */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pt-8 border-t border-border">
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail size={16} className="text-primary" />
                <span className="text-sm">support@streamflix.com</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Phone size={16} className="text-primary" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <MapPin size={16} className="text-primary" />
                <span className="text-sm">123 Streaming St, Digital City, DC 12345</span>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Follow Us</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg flex items-center justify-center transition-all duration-200"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg flex items-center justify-center transition-all duration-200"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg flex items-center justify-center transition-all duration-200"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-lg flex items-center justify-center transition-all duration-200"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© {currentYear} Streamflix. All rights reserved.</span>
              <span>•</span>
              <span>Made with</span>
              <Heart size={14} className="text-destructive fill-current" />
              <span>for movie lovers</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-foreground transition-colors duration-200">
                Terms of Service
              </Link>
              <Link to="/help" className="hover:text-foreground transition-colors duration-200">
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;