import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const DB_DIR = path.resolve(process.cwd(), 'server');
const SQLITE_PATH = path.join(DB_DIR, 'database.db');
const JSON_PATH = path.join(DB_DIR, 'db.json');

// Ensure server directory exists
if (!existsSync(DB_DIR)) {
  await fs.mkdir(DB_DIR, { recursive: true });
}

let dbMode = 'sqlite';
let sqliteDb = null;

try {
  // Dynamically import sqlite3 to handle cases where it isn't fully compiled or installed
  const sqlite3Module = await import('sqlite3');
  // Get the default export or the module itself
  const sqlite3 = sqlite3Module.default ? sqlite3Module.default : sqlite3Module;
  
  sqliteDb = await new Promise((resolve, reject) => {
    const db = new sqlite3.Database(SQLITE_PATH, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
  
  // Initialize SQLite tables
  await new Promise((resolve, reject) => {
    sqliteDb.serialize(() => {
      // 1. Create users table
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          display_name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => { if (err) reject(err); });

      // 2. Create scores table with optional user_id
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          name TEXT NOT NULL,
          score INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
      `, (err) => { if (err) reject(err); });
      
      // 3. Create messages table with optional user_id
      sqliteDb.run(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          name TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id)
        )
      `, (err) => { if (err) reject(err); });

      // Migrations: Alter tables to add user_id column if database existed before
      sqliteDb.run(`ALTER TABLE scores ADD COLUMN user_id INTEGER`, () => {});
      sqliteDb.run(`ALTER TABLE messages ADD COLUMN user_id INTEGER`, () => {
        resolve(); // Resolve after the last migration attempt
      });
    });
  });
  
  console.log('Successfully connected to SQLite database at:', SQLITE_PATH);
} catch (error) {
  dbMode = 'json';
  console.warn('SQLite is not available or failed to initialize. Falling back to JSON database.', error.message);
  
  // Initialize JSON database file if it doesn't exist
  if (!existsSync(JSON_PATH)) {
    await fs.writeFile(JSON_PATH, JSON.stringify({ users: [], scores: [], messages: [] }, null, 2), 'utf-8');
    console.log('Initialized JSON database file at:', JSON_PATH);
  } else {
    // If JSON database exists, ensure users namespace is present
    fs.readFile(JSON_PATH, 'utf-8').then(data => {
      try {
        const parsed = JSON.parse(data);
        let updated = false;
        if (!parsed.users) { parsed.users = []; updated = true; }
        if (!parsed.scores) { parsed.scores = []; updated = true; }
        if (!parsed.messages) { parsed.messages = []; updated = true; }
        if (updated) {
          fs.writeFile(JSON_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
        }
      } catch(e) {}
    }).catch(() => {});
    console.log('Using existing JSON database file at:', JSON_PATH);
  }
}

// JSON Database Helper functions
async function readJsonDb() {
  try {
    const data = await fs.readFile(JSON_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      users: parsed.users || [],
      scores: parsed.scores || [],
      messages: parsed.messages || []
    };
  } catch (err) {
    return { users: [], scores: [], messages: [] };
  }
}

async function writeJsonDb(data) {
  await fs.writeFile(JSON_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Public API

// User management
export async function createUser(username, passwordHash, displayName) {
  if (!username || !passwordHash || !displayName) {
    throw new Error('All fields are required');
  }

  if (dbMode === 'sqlite') {
    return new Promise((resolve, reject) => {
      sqliteDb.run(
        'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
        [username, passwordHash, displayName],
        function (err) {
          if (err) {
            if (err.message.includes('UNIQUE')) {
              reject(new Error('Username already exists'));
            } else {
              reject(err);
            }
          } else {
            resolve({ id: this.lastID, username, display_name: displayName });
          }
        }
      );
    });
  } else {
    const db = await readJsonDb();
    if (db.users.some(u => u.username === username)) {
      throw new Error('Username already exists');
    }
    const newRecord = {
      id: db.users.length + 1,
      username,
      password_hash: passwordHash,
      display_name: displayName,
      created_at: new Date().toISOString()
    };
    db.users.push(newRecord);
    await writeJsonDb(db);
    return { id: newRecord.id, username, display_name: displayName };
  }
}

export async function getUserByUsername(username) {
  if (dbMode === 'sqlite') {
    return new Promise((resolve, reject) => {
      sqliteDb.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  } else {
    const db = await readJsonDb();
    const user = db.users.find(u => u.username === username);
    return user || null;
  }
}

export async function getUserById(id) {
  if (dbMode === 'sqlite') {
    return new Promise((resolve, reject) => {
      sqliteDb.get(
        'SELECT id, username, display_name FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  } else {
    const db = await readJsonDb();
    const user = db.users.find(u => u.id === id);
    if (!user) return null;
    return { id: user.id, username: user.username, display_name: user.display_name };
  }
}

// Scores management
export async function getTopScores(limit = 10) {
  if (dbMode === 'sqlite') {
    return new Promise((resolve, reject) => {
      sqliteDb.all(
        `SELECT s.name, s.score, s.created_at, s.user_id, u.display_name AS member_name
         FROM scores s
         LEFT JOIN users u ON s.user_id = u.id
         ORDER BY s.score DESC, s.created_at DESC LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else {
            const mapped = rows.map(r => ({
              name: r.member_name || r.name,
              score: r.score,
              created_at: r.created_at,
              is_member: !!r.user_id
            }));
            resolve(mapped);
          }
        }
      );
    });
  } else {
    const db = await readJsonDb();
    const sorted = db.scores
      .sort((a, b) => b.score - a.score || new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
      
    return sorted.map(s => {
      let displayName = s.name;
      let isMember = false;
      if (s.user_id) {
        const user = db.users.find(u => u.id === s.user_id);
        if (user) {
          displayName = user.display_name;
          isMember = true;
        }
      }
      return {
        name: displayName,
        score: s.score,
        created_at: s.created_at,
        is_member: isMember
      };
    });
  }
}

export async function saveScore(name, score, userId = null) {
  if (!name || typeof score !== 'number') {
    throw new Error('Invalid score data');
  }
  
  if (dbMode === 'sqlite') {
    return new Promise((resolve, reject) => {
      sqliteDb.run(
        'INSERT INTO scores (name, score, user_id) VALUES (?, ?, ?)',
        [name, score, userId],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, name, score, user_id: userId, created_at: new Date().toISOString() });
        }
      );
    });
  } else {
    const db = await readJsonDb();
    const newRecord = {
      id: db.scores.length + 1,
      name,
      score,
      user_id: userId,
      created_at: new Date().toISOString()
    };
    db.scores.push(newRecord);
    await writeJsonDb(db);
    return newRecord;
  }
}

// Messages management
export async function getMessages(limit = 50) {
  if (dbMode === 'sqlite') {
    return new Promise((resolve, reject) => {
      sqliteDb.all(
        `SELECT m.id, m.name, m.content, m.created_at, m.user_id, u.display_name AS member_name
         FROM messages m
         LEFT JOIN users u ON m.user_id = u.id
         ORDER BY m.created_at DESC LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else {
            const mapped = rows.map(r => ({
              id: r.id,
              name: r.member_name || r.name,
              content: r.content,
              created_at: r.created_at,
              is_member: !!r.user_id
            }));
            resolve(mapped);
          }
        }
      );
    });
  } else {
    const db = await readJsonDb();
    const sorted = db.messages
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
      
    return sorted.map(m => {
      let displayName = m.name;
      let isMember = false;
      if (m.user_id) {
        const user = db.users.find(u => u.id === m.user_id);
        if (user) {
          displayName = user.display_name;
          isMember = true;
        }
      }
      return {
        id: m.id,
        name: displayName,
        content: m.content,
        created_at: m.created_at,
        is_member: isMember
      };
    });
  }
}

export async function saveMessage(name, content, userId = null) {
  if (!name || !content) {
    throw new Error('Name and content are required');
  }
  
  if (dbMode === 'sqlite') {
    return new Promise((resolve, reject) => {
      sqliteDb.run(
        'INSERT INTO messages (name, content, user_id) VALUES (?, ?, ?)',
        [name, content, userId],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, name, content, user_id: userId, created_at: new Date().toISOString() });
        }
      );
    });
  } else {
    const db = await readJsonDb();
    const newRecord = {
      id: db.messages.length + 1,
      name,
      content,
      user_id: userId,
      created_at: new Date().toISOString()
    };
    db.messages.push(newRecord);
    await writeJsonDb(db);
    return newRecord;
  }
}
