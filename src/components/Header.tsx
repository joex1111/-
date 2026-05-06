import { useState, useEffect } from 'react';
import { Moon, Sun, Palette } from 'lucide-react';
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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [colorTheme, setColorTheme] = useState('cyan');
  const [showColors, setShowColors] = useState(false);

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
    <header className="header glass">
      <div className="header-content container">
        <div className="logo" onClick={() => scrollToSection('intro')}>
          期中<span>網站</span>
        </div>
        <nav className="nav-links">
          <button onClick={() => scrollToSection('intro')} className="nav-btn">網站介紹</button>
          <button onClick={() => scrollToSection('profile')} className="nav-btn">個人簡介</button>
          <button onClick={() => scrollToSection('game')} className="nav-btn">小遊戲</button>
        </nav>
        
        <div className="header-actions">
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
  );
};

export default Header;
