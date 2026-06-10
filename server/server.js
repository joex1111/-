import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  getTopScores, 
  saveScore, 
  getMessages, 
  saveMessage, 
  createUser, 
  getUserByUsername, 
  getUserById 
} from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'neon-cyberpunk-secret-key-999';

// Middlewares
app.use(cors());
app.use(express.json());

// Auth Middlewares
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next();
  });
}

// --- Auth Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    
    if (!username || !password || !displayName) {
      return res.status(400).json({ error: 'Username, password and display name are required' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const user = await createUser(username.trim(), passwordHash, displayName.trim());
    
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({ token, user });
  } catch (error) {
    console.error('Registration failed:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await getUserByUsername(username.trim());
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        display_name: user.display_name 
      } 
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get Current User Info
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Failed to get user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Application Routes ---

// 1. Leaderboard API
app.get('/api/scores', async (req, res) => {
  try {
    const scores = await getTopScores(10);
    res.json(scores);
  } catch (error) {
    console.error('Failed to get scores:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/scores', optionalAuthenticate, async (req, res) => {
  try {
    const { name, score } = req.body;
    const userId = req.user ? req.user.userId : null;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ error: 'Invalid score' });
    }
    
    const newRecord = await saveScore(name.trim(), score, userId);
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Failed to save score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Guestbook API
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await getMessages(30);
    res.json(messages);
  } catch (error) {
    console.error('Failed to get messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/messages', optionalAuthenticate, async (req, res) => {
  try {
    const { name, content } = req.body;
    const userId = req.user ? req.user.userId : null;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    const newRecord = await saveMessage(name.trim(), content.trim(), userId);
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Failed to save message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
