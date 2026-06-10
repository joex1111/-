import React, { useState } from 'react';
import { X, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'login' | 'register';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setError(null);
    setUsername('');
    setPassword('');
    setDisplayName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('請填寫帳號與密碼');
      return;
    }

    if (activeTab === 'register' && !displayName.trim()) {
      setError('請填寫顯示暱稱');
      return;
    }

    if (password.length < 6) {
      setError('密碼長度必須至少為 6 個字元');
      return;
    }

    try {
      setLoading(true);
      if (activeTab === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password, displayName.trim());
      }
      onClose(); // Close modal on success
    } catch (err: any) {
      setError(err.message || '發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-container glass" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="關閉">
          <X size={20} />
        </button>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => handleTabChange('login')}
          >
            登入會員
          </button>
          <button
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => handleTabChange('register')}
          >
            註冊帳號
          </button>
        </div>

        {error && <div className="auth-error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="auth-username" className="form-label">帳號 (Username)</label>
            <input
              id="auth-username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="輸入帳號 (至少 3 字元)..."
              disabled={loading}
              required
            />
          </div>

          {activeTab === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-display-name" className="form-label">顯示暱稱 (Nickname)</label>
              <input
                id="auth-display-name"
                type="text"
                className="form-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="輸入要在排行榜/留言板顯示的名字..."
                disabled={loading}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-password" className="form-label">密碼 (Password)</label>
            <input
              id="auth-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入密碼 (至少 6 字元)..."
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="spinner" size={18} />
                處理中...
              </>
            ) : activeTab === 'login' ? (
              <>
                <LogIn size={18} />
                登入
              </>
            ) : (
              <>
                <UserPlus size={18} />
                註冊並登入
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
