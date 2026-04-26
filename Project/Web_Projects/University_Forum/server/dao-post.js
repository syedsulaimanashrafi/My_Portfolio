'use strict';

const sqlite = require('sqlite3');
const dayjs = require('dayjs');

// Open the database
const db = new sqlite.Database('forum.db', (err) => {
  if (err) throw err;
});

// Create the posts table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT UNIQUE NOT NULL,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  max_comments INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(author) REFERENCES users(username)
)`, (err) => {
  if (err) {
    console.error('Error creating posts table:', err);
  }
});

// Get all posts ordered by creation date (newest first)
exports.getAllPosts = () => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT p.*, 
             COUNT(c.id) as comment_count
      FROM posts p
      LEFT JOIN comments c ON p.id = c.post_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const posts = rows.map(row => ({
          id: row.id,
          title: row.title,
          text: row.text,
          author: row.author,
          maxComments: row.max_comments,
          commentCount: row.comment_count,
          createdAt: dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs(row.updated_at).format('YYYY-MM-DD HH:mm:ss')
        }));
        resolve(posts);
      }
    });
  });
};

// Get a specific post by ID
exports.getPost = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT p.*, 
             COUNT(c.id) as comment_count
      FROM posts p
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.id = ?
      GROUP BY p.id
    `;
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        const post = {
          id: row.id,
          title: row.title,
          text: row.text,
          author: row.author,
          maxComments: row.max_comments,
          commentCount: row.comment_count,
          createdAt: dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs(row.updated_at).format('YYYY-MM-DD HH:mm:ss')
        };
        resolve(post);
      } else {
        resolve(null);
      }
    });
  });
};

// Create a new post
exports.createPost = (title, text, author, maxComments = null) => {
  return new Promise((resolve, reject) => {
    // First check if title already exists
    const checkSql = 'SELECT id FROM posts WHERE title = ?';
    db.get(checkSql, [title], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        reject(new Error('Title already exists'));
      } else {
        const sql = 'INSERT INTO posts (title, text, author, max_comments) VALUES (?, ?, ?, ?)';
        db.run(sql, [title, text, author, maxComments], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        });
      }
    });
  });
};

// Update a post
exports.updatePost = (id, title, text, maxComments = null) => {
  return new Promise((resolve, reject) => {
    // First check if title already exists for a different post
    const checkSql = 'SELECT id FROM posts WHERE title = ? AND id != ?';
    db.get(checkSql, [title, id], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        reject(new Error('Title already exists'));
      } else {
        const sql = 'UPDATE posts SET title = ?, text = ?, max_comments = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        db.run(sql, [title, text, maxComments, id], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        });
      }
    });
  });
};

// Delete a post and its comments
exports.deletePost = (id) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Delete comments first
      db.run('DELETE FROM comments WHERE post_id = ?', [id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }
        
        // Delete interesting flags for comments
        db.run('DELETE FROM interesting_flags WHERE comment_id IN (SELECT id FROM comments WHERE post_id = ?)', [id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          // Delete the post
          db.run('DELETE FROM posts WHERE id = ?', [id], function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
            } else {
              db.run('COMMIT');
              resolve(this.changes > 0);
            }
          });
        });
      });
    });
  });
};

// Get posts by author
exports.getPostsByAuthor = (author) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT p.*, 
             COUNT(c.id) as comment_count
      FROM posts p
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.author = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    db.all(sql, [author], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const posts = rows.map(row => ({
          id: row.id,
          title: row.title,
          text: row.text,
          author: row.author,
          maxComments: row.max_comments,
          commentCount: row.comment_count,
          createdAt: dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs(row.updated_at).format('YYYY-MM-DD HH:mm:ss')
        }));
        resolve(posts);
      }
    });
  });
};
