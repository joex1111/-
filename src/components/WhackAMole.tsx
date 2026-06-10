import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Trophy, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import './WhackAMole.css';

type MoleType = 'gold' | 'silver' | 'black' | 'normal';

interface MoleData {
  id: number;
  index: number;
  type: MoleType;
}

interface HitData {
  index: number;
  score: number;
  type: MoleType;
}

const getRandomType = (): MoleType => {
  const rand = Math.random();
  // 金 5%, 黑 15%, 銀 20%, 一般 60%
  if (rand < 0.05) return 'gold';
  if (rand < 0.20) return 'black'; // 0.05 ~ 0.20 (15%)
  if (rand < 0.40) return 'silver'; // 0.20 ~ 0.40 (20%)
  return 'normal'; // 0.40 ~ 1.0 (60%)
};

const getScore = (type: MoleType): number => {
  switch (type) {
    case 'gold': return 50;
    case 'silver': return 20;
    case 'black': return -10;
    case 'normal': return 10;
  }
};

interface LeaderboardRecord {
  name: string;
  score: number;
  created_at: string;
  is_member?: boolean;
}

const WhackAMole = () => {
  const { user, token } = useAuth();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMoles, setActiveMoles] = useState<MoleData[]>([]);
  const [hitMoles, setHitMoles] = useState<HitData[]>([]);
  
  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<LeaderboardRecord[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/scores`);
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setLeaderboard(data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setActiveMoles([]);
    setHitMoles([]);
    setHasSubmitted(false);
    setPlayerName('');
  };

  const endGame = useCallback(() => {
    setIsPlaying(false);
    setActiveMoles([]);
  }, []);

  const submitScore = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = user ? user.display_name : playerName.trim();
    if (!finalName || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/api/scores`, {
        key: 'submit-score',
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: finalName,
          score: score,
        }),
      } as RequestInit);

      if (response.ok) {
        setHasSubmitted(true);
        fetchLeaderboard();
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Timer loop
  useEffect(() => {
    let timer: number;
    if (isPlaying && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      endGame();
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, endGame]);

  // Game loop for spawning moles
  useEffect(() => {
    if (!isPlaying) return;

    let spawnTimer: number;

    const spawn = () => {
      const currentLeft = timeLeftRef.current;
      if (currentLeft <= 0) return;

      const timePassed = 30 - currentLeft;
      
      let numToSpawn = 1;
      if (timePassed > 15) numToSpawn = 2; // 剩餘 15 秒時一次出 2 隻
      if (timePassed > 25) numToSpawn = 3; // 剩餘 5 秒時一次出 3 隻

      // 速度變慢：初始 1.5 秒，最快 0.75 秒
      const spawnInterval = Math.max(750, 1500 - timePassed * 25);
      const stayTime = Math.max(900, 1500 - timePassed * 20);

      setActiveMoles(prev => {
        if (prev.length > 8) return prev; 
        
        const currentActive = [...prev];
        const activeIndices = currentActive.map(m => m.index);
        const available = Array.from({length: 25}, (_, i) => i).filter(i => !activeIndices.includes(i));
        
        const newMoles: MoleData[] = [];
        for(let i = 0; i < numToSpawn; i++) {
          if (available.length === 0) break;
          const randomIndex = Math.floor(Math.random() * available.length);
          const moleIndex = available.splice(randomIndex, 1)[0];
          const type = getRandomType();
          const uniqueId = Date.now() + Math.random(); // 產生唯一 ID
          
          newMoles.push({ id: uniqueId, index: moleIndex, type });
          
          window.setTimeout(() => {
            // 使用 uniqueId 來移除，避免誤刪新生成在同一個洞的地鼠
            setActiveMoles(current => current.filter(m => m.id !== uniqueId));
          }, stayTime);
        }
        
        return [...currentActive, ...newMoles];
      });

      spawnTimer = window.setTimeout(spawn, spawnInterval);
    };

    spawnTimer = window.setTimeout(spawn, 500);

    return () => clearTimeout(spawnTimer);
  }, [isPlaying]);

  const whack = (index: number) => {
    if (!isPlaying) return;
    
    const mole = activeMoles.find(m => m.index === index);
    if (mole) {
      const scoreChange = getScore(mole.type);
      setScore((prev) => prev + scoreChange);
      
      // 使用 uniqueId 移除被擊中的地鼠
      setActiveMoles((prev) => prev.filter(m => m.id !== mole.id));
      setHitMoles((prev) => [...prev, { index, score: scoreChange, type: mole.type }]);
      
      setTimeout(() => {
        setHitMoles((prev) => prev.filter(m => m.index !== index));
      }, 500);
    }
  };

  return (
    <section id="game" className="section game-section">
      <div className="container">
        <h2>打地鼠挑戰</h2>
        
        <div className="game-layout">
          {/* 左側：遊戲面板 */}
          <div className="game-board-wrapper glass">
            <div className="game-stats">
              <div className="stat-box">
                <Trophy className="stat-icon" />
                <span>分數: {score}</span>
              </div>
              <div className="stat-box">
                <Clock className="stat-icon" />
                <span>時間: {timeLeft}s</span>
              </div>
            </div>

            <div className="grid">
              {Array.from({ length: 25 }).map((_, index) => {
                const activeMole = activeMoles.find(m => m.index === index);
                const hitMole = hitMoles.find(m => m.index === index);
                
                return (
                  <div key={index} className="hole-container" onClick={() => whack(index)}>
                    <div className="hole"></div>
                    <div 
                      className={`mole ${activeMole ? 'up ' + activeMole.type : ''} ${hitMole ? 'hit ' + hitMole.type : ''}`}
                    ></div>
                    {hitMole && (
                      <div className={`hit-effect ${hitMole.score < 0 ? 'negative' : ''} ${hitMole.type === 'gold' ? 'gold-score' : ''} ${hitMole.type === 'silver' ? 'silver-score' : ''}`}>
                        {hitMole.score > 0 ? '+' : ''}{hitMole.score}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="game-controls">
              {!isPlaying ? (
                <button className="btn btn-primary" onClick={startGame}>
                  {timeLeft === 0 ? <RotateCcw size={20} /> : <Play size={20} />}
                  {timeLeft === 0 ? '再玩一次' : '開始遊戲'}
                </button>
              ) : (
                <button className="btn btn-danger" onClick={endGame}>
                  結束遊戲
                </button>
              )}
            </div>
            
            {timeLeft === 0 && !isPlaying && (
              <div className="game-over-msg">
                <h3>遊戲結束！</h3>
                <p>您的最終得分是 {score} 分</p>
                
                {!hasSubmitted ? (
                  user ? (
                    <div style={{ marginTop: '1rem' }}>
                      <p>您已登入為 <strong>{user.display_name}</strong></p>
                      <button 
                        onClick={() => submitScore()} 
                        className="btn btn-primary" 
                        style={{ marginTop: '0.8rem' }}
                        disabled={isSubmitting}
                      >
                        提交成績到排行榜
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={submitScore} className="score-submit-form">
                      <p>輸入名字以紀錄您的佳績：</p>
                      <div className="score-submit-input-group">
                        <input
                          type="text"
                          className="score-submit-input"
                          placeholder="請輸入暱稱..."
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          maxLength={15}
                          disabled={isSubmitting}
                          required
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 1rem' }} disabled={isSubmitting}>
                          提交
                        </button>
                      </div>
                    </form>
                  )
                ) : (
                  <p style={{ color: 'var(--success)', marginTop: '1rem', fontWeight: 'bold' }}>分數已成功提交至排行榜！</p>
                )}
              </div>
            )}
          </div>

          {/* 右側：排行榜 */}
          <div className="leaderboard-wrapper glass">
            <h3>
              <Trophy size={20} color="var(--accent)" />
              排行榜 TOP 10
            </h3>
            
            <div className="leaderboard-list">
              {leaderboard.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>目前尚無紀錄</p>
              ) : (
                leaderboard.slice(0, 10).map((record, index) => (
                  <div key={index} className={`leaderboard-item ${index < 3 ? 'top-3' : ''}`}>
                    <div className={`rank-badge rank-${index + 1}`}>
                      {index + 1}
                    </div>
                    <div className="leaderboard-player" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {record.name}
                      {record.is_member && (
                        <span className="member-badge" title="已驗證會員" style={{ color: '#ffd700', textShadow: '0 0 5px rgba(255, 215, 0, 0.8)', fontSize: '0.9rem' }}>★</span>
                      )}
                    </div>
                    <div className="leaderboard-score">{record.score} 分</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhackAMole;
