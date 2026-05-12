import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthContext } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isLandingPage = location.pathname === '/';
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear the auth token
    navigate('/auth'); // Redirect to login/signup page
  };
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
      <div className="container mx-auto px-0">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <img src="/programming.png" alt="Icon" className="w-7 h-7 object-contain" />
            <span className="font-space font-bold text-xl text-gradient-primary">
              PortFolia
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <div className="flex items-center space-x-6">
                <Link
                  to="/dashboard"
                  className="text-foreground-muted hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/projects"
                  className="text-foreground-muted hover:text-foreground transition-colors"
                >
                  Projects
                </Link>
                <Link
                  to="/skills"
                  className="text-foreground-muted hover:text-foreground transition-colors"
                >
                  Skills
                </Link>
                <Link
                  to="/achievements"
                  className="text-foreground-muted hover:text-foreground transition-colors"
                >
                  Achievements
                </Link>
                <Link
                  to="/portfolio"
                  className="text-foreground-muted hover:text-foreground transition-colors"
                >
                  Portfolio
                </Link>
                <Link
                  to="/export"
                  className="text-foreground-muted hover:text-foreground transition-colors"
                >
                  Export
                </Link>
                <Link to="/profile" className="p-2 rounded-full hover:bg-muted transition-colors">
                  <User className="w-6 h-6 text-foreground-muted" />
                </Link>
                <LogOut
                  className="w-4 h-4 text-foreground-muted text-red-500 hover:text-red-700 cursor-pointer"
                  onClick={handleLogout}
                />
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="btn-primary">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/20 mt-2 pt-4 pb-4 animate-slide-in-up">
            <div className="flex flex-col space-y-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-foreground-muted hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/projects"
                    className="text-foreground-muted hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Projects
                  </Link>
                  <Link
                    to="/skills"
                    className="text-foreground-muted hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Skills
                  </Link>
                  <Link
                    to="/achievements"
                    className="text-foreground-muted hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Achievements
                  </Link>
                  <Link
                    to="/portfolio"
                    className="text-foreground-muted hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Portfolio
                  </Link>
                  <Link
                    to="/profile"
                    className="text-foreground-muted hover:text-foreground transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button className="btn-primary w-full">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;