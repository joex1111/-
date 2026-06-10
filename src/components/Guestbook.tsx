import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Loader2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Guestbook.css';

interface Message {
  id: number;
  name: string;
  content: string;
  created_at: string;
  is_member?: boolean;
}

const Guestbook = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Prefill user's display name if logged in
  useEffect(() => {
    if (user) {
      setName(user.display_name);
    } else {
      setName('');
    }
  }, [user]);

  // Fetch messages from backend
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messages');
      if (!response.ok) {
        throw new Error('無法取得留言列表');
      }
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const finalName = user ? user.display_name : name.trim();
    if (!finalName) {
      setFormError('請輸入您的名字');
      return;
    }
    if (!content.trim()) {
      setFormError('請輸入留言內容');
      return;
    }

    try {
      setSubmitLoading(true);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/messages', {
        key: 'submit-message',
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: finalName,
          content: content.trim(),
        }),
      } as RequestInit);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '留言送出失敗，請稍後再試');
      }

      const newMsg = await response.json();
      
      // Inject is_member locally for immediate display
      const displayMsg = {
        ...newMsg,
        name: finalName,
        is_member: !!user
      };

      setMessages((prev) => [displayMsg, ...prev]);
      setContent('');
    } catch (err: any) {
      setFormError(err.message || '發生錯誤');
    } finally {
      setSubmitLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <section id="guestbook" className="section guestbook-section">
      <div className="container">
        <h2>霓虹留言板</h2>
        
        <div className="guestbook-container glass">
          <div className="guestbook-layout">
            
            {/* Left Side: Submit Message Form */}
            <div className="guestbook-form">
              <h3>撰寫留言</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="guest-name" className="form-label">您的名字</label>
                  <input
                    id="guest-name"
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="輸入您的暱稱..."
                    maxLength={30}
                    disabled={submitLoading || !!user}
                  />
                  {user && (
                    <small style={{ color: 'var(--accent)', marginTop: '0.4rem', display: 'block', fontSize: '0.8rem' }}>
                      您已登入會員，系統將自動關聯您的暱稱。
                    </small>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="guest-content" className="form-label">留言內容</label>
                  <textarea
                    id="guest-content"
                    className="form-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="留下你想說的話..."
                    maxLength={500}
                    disabled={submitLoading}
                  />
                </div>

                {formError && <div className="error-msg">{formError}</div>}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '1rem' }}
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="spinner" size={20} />
                      傳送中...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      送出留言
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Side: Message List */}
            <div className="guestbook-messages">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '4px solid var(--accent)', paddingLeft: '0.8rem', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                <MessageSquare size={20} color="var(--accent)" />
                最新留言 ({messages.length})
              </h3>
              
              {loading ? (
                <div className="status-indicator">
                  <Loader2 className="spinner" size={24} />
                  <span>載入留言中...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="no-messages">
                  <p>目前還沒有任何留言，快來當第一個留言的人吧！</p>
                </div>
              ) : (
                <div className="guestbook-list">
                  {messages.map((msg) => (
                    <div key={msg.id} className="message-card">
                      <div className="message-header">
                        <div className="message-author" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <User size={16} />
                          {msg.name}
                          {msg.is_member && (
                            <span className="member-tag" title="已驗證會員">會員</span>
                          )}
                        </div>
                        <div className="message-date">{formatDate(msg.created_at)}</div>
                      </div>
                      <div className="message-body">{msg.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
};

export default Guestbook;
