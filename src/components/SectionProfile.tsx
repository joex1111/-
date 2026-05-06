import { User, Code, Palette, Zap } from 'lucide-react';
import './SectionProfile.css';

const SectionProfile = () => {
  return (
    <section id="profile" className="section profile-section">
      <div className="container">
        <h2>個人簡介</h2>

        <div className="profile-content">
          <div className="profile-card glass">
            <div className="avatar-container">
              <div className="avatar-placeholder">
                <User size={64} color="var(--bg-primary)" />
              </div>
              <div className="avatar-glow"></div>
            </div>

            <h3 className="profile-name">藍健洲</h3>
            <p className="profile-title">金門大學資訊工程學系大三生</p>

            <div className="profile-bio">
              <p>
                目前正在學習用vibe coding寫網頁。
              </p>
            </div>
          </div>

          <div className="skills-grid">
            <div className="skill-card glass">
              <div className="skill-icon"><Code size={32} /></div>
              <h4>前端開發</h4>
              <p>熟悉 React, TypeScript, HTML/CSS 等現代前端技術，打造高互動性網頁。</p>
            </div>

            <div className="skill-card glass">
              <div className="skill-icon"><Palette size={32} /></div>
              <h4>視覺設計</h4>
              <p>著重於使用者體驗與介面設計，熟練運用深色模式與霓虹科技風格。</p>
            </div>

            <div className="skill-card glass">
              <div className="skill-icon"><Zap size={32} /></div>
              <h4>效能優化</h4>
              <p>注重網頁載入速度與動畫效能，為使用者帶來最流暢的數位體驗。</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionProfile;
