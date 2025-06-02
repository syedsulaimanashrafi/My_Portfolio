'use strict';

const sqlite = require('sqlite3');
const crypto = require('crypto');

// Open the database
const db = new sqlite.Database('forum.db', (err) => {
  if (err) throw err;
});

// Create the users table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  salt TEXT NOT NULL,
  secret TEXT,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
  if (err) {
    console.error('Error creating users table:', err);
  }
});

// Get a user by ID
exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) 
        reject(err);
      else if (row === undefined)
        resolve({error: 'User not found.'});
      else {
        const user = {id: row.id, username: row.username, role: row.role, secret: row.secret}
        resolve(user);
      }
    });
  });
};

// Get a user by username and verify password
exports.getUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) { reject(err); }
      else if (row === undefined) { resolve(false); }
      else {
        const user = {id: row.id, username: row.username, role: row.role, secret: row.secret};
        
        console.log(`Authenticating user: ${username}`);
        console.log(`Retrieved salt: ${row.salt}, Stored password: ${row.password}`);
        
        const salt = Buffer.from(row.salt, 'hex');
        crypto.scrypt(password, salt, 32, (err, hashedPassword) => {
          if (err) reject(err);

          const passwordHex = Buffer.from(row.password, 'hex');

          if(!crypto.timingSafeEqual(passwordHex, hashedPassword))
            resolve(false);
          else resolve(user); 
        });
      }
    });
  });
};

// Get a user by username only
exports.getUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, username, role, secret FROM users WHERE username = ?';
    db.get(sql, [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Create a new user
exports.createUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 32, (err, hashedPassword) => {
      if (err) reject(err);
      const passwordHex = hashedPassword.toString('hex');
      const saltHex = salt.toString('hex');
      
      console.log(`Creating user: ${username}`);
      console.log(`Hashed password: ${passwordHex}, Salt: ${saltHex}`);
      
      const sql = 'INSERT INTO users (username, password, salt) VALUES (?, ?, ?)';
      db.run(sql, [username, passwordHex, saltHex], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  });
};

// Create admin user if it doesn't exist
exports.createAdminUser = (username, password) => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 32, (err, hashedPassword) => {
      if (err) reject(err);
      const passwordHex = hashedPassword.toString('hex');
      const saltHex = salt.toString('hex');
      
      const sql = 'INSERT INTO users (username, password, salt, role, secret) VALUES (?, ?, ?, ?, ?)';
      db.run(sql, [username, passwordHex, saltHex, 'admin', 'LXBSMDTMSP2I5XFXIYRGFVWSFI'], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  });
};

// Get all users (admin only)
exports.getAllUsers = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};
