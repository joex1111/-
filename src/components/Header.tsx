import { useState, useEffect } from 'react';
import { Moon, Sun, Palette, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import './Header.css';

const colors = [
  { id: 'cyan', hex: '#00f0ff' },
  { id: 'purple', hex: '#b000ff' },
  { id: 'pink', hex: '#ff007f' },
  { id: 'green', hex: '#00ffaa' },
  { id: 'orange', hex: '#ff8800' },
  { id: 'yellow', hex: '#ffd700' }
];

const Header = () => {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [colorTheme, setColorTheme] = useState('cyan');
  const [showColors, setShowColors] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-color', colorTheme);
  }, [colorTheme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="header glass">
        <div className="header-content container">
          <div className="logo" onClick={() => scrollToSection('intro')}>
            期中<span>網站</span>
          </div>
          <nav className="nav-links">
            <button onClick={() => scrollToSection('intro')} className="nav-btn">網站介紹</button>
            <button onClick={() => scrollToSection('profile')} className="nav-btn">個人簡介</button>
            <button onClick={() => scrollToSection('game')} className="nav-btn">小遊戲</button>
            <button onClick={() => scrollToSection('guestbook')} className="nav-btn">留言板</button>
          </nav>
          
          <div className="header-actions">
            {/* 會員登入功能 */}
            {user ? (
              <div className="user-menu-container">
                <button 
                  className="user-menu-btn" 
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <User size={16} color="var(--accent)" />
                  <span>{user.display_name}</span>
                  <ChevronDown size={14} />
                </button>
                
                {showDropdown && (
                  <div className="user-dropdown glass">
                    <button 
                      className="dropdown-item" 
                      onClick={() => {
                        logout();
                        setShowDropdown(false);
                      }}
                    >
                      <LogOut size={14} />
                      登出會員
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                className="user-menu-btn"
                style={{ padding: '0.5rem 1rem' }}
                onClick={() => setIsAuthModalOpen(true)}
              >
                <User size={16} />
                會員登入
              </button>
            )}

            <div className="color-picker-container">
              <button 
                className="theme-toggle color-picker-btn" 
                onClick={() => setShowColors(!showColors)}
                aria-label="選擇主題顏色"
              >
                <Palette size={20} />
              </button>
              
              {showColors && (
                <div className="color-dropdown glass">
                  {colors.map(c => (
                    <button
                      key={c.id}
                      className={`color-circle ${colorTheme === c.id ? 'active' : ''}`}
                      style={{ backgroundColor: c.hex }}
                      onClick={() => {
                        setColorTheme(c.id);
                        setShowColors(false);
                      }}
                      aria-label={`選擇顏色 ${c.id}`}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <button className="theme-toggle" onClick={toggleTheme} aria-label="切換深淺模式">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export default Header;
