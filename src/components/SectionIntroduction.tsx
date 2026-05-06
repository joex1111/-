import { Gamepad2, ArrowDown } from 'lucide-react';
import './SectionIntroduction.css';

const SectionIntroduction = () => {
  const scrollToNext = () => {
    const element = document.getElementById('profile');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="intro" className="section intro-section">
      <div className="container intro-content">
        <div className="intro-text">
          <h1 className="float-anim">探索無界限的<br/>數位體驗</h1>
          <p className="intro-desc">
            這是一個結合現代化網頁設計與互動小遊戲的個人作品集。
            透過 React 與 TypeScript，我們打造了流暢的轉場與高質感的霓虹深色主題。
            往下滑動，認識我，並挑戰打地鼠的最高分數！
          </p>
          <div className="intro-actions">
            <button className="btn btn-primary" onClick={() => document.getElementById('game')?.scrollIntoView({ behavior: 'smooth' })}>
              <Gamepad2 size={20} />
              立即遊玩
            </button>
            <button className="btn btn-outline" onClick={scrollToNext}>
              <ArrowDown size={20} />
              了解更多
            </button>
          </div>
        </div>
        
        <div className="intro-visual">
          <div className="visual-card glass float-anim" style={{ animationDelay: '1s' }}>
            <div className="visual-circle"></div>
            <div className="visual-lines">
              <div className="line line-1"></div>
              <div className="line line-2"></div>
              <div className="line line-3"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionIntroduction;
