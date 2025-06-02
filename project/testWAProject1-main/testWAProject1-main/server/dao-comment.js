'use strict';

const sqlite = require('sqlite3');
const dayjs = require('dayjs');

// Open the database
const db = new sqlite.Database('forum.db', (err) => {
  if (err) throw err;
});

// Create the comments table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  text TEXT NOT NULL,
  author TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(post_id) REFERENCES posts(id),
  FOREIGN KEY(author) REFERENCES users(username)
)`, (err) => {
  if (err) {
    console.error('Error creating comments table:', err);
  }
});

// Create the interesting_flags table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS interesting_flags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(comment_id) REFERENCES comments(id),
  FOREIGN KEY(user_id) REFERENCES users(username),
  UNIQUE(comment_id, user_id)
)`, (err) => {
  if (err) {
    console.error('Error creating interesting_flags table:', err);
  }
});

// Get all comments for a post ordered by creation date (oldest first)
exports.getCommentsByPost = (postId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT c.*, 
             COUNT(f.id) as interesting_count,
             GROUP_CONCAT(f.user_id) as interesting_users
      FROM comments c
      LEFT JOIN interesting_flags f ON c.id = f.comment_id
      WHERE c.post_id = ?
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `;
    db.all(sql, [postId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const comments = rows.map(row => ({
          id: row.id,
          postId: row.post_id,
          text: row.text,
          author: row.author || 'Anonymous',
          interestingCount: row.interesting_count,
          interestingUsers: row.interesting_users ? row.interesting_users.split(',') : [],
          createdAt: dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs(row.updated_at).format('YYYY-MM-DD HH:mm:ss')
        }));
        resolve(comments);
      }
    });
  });
};

// Get a specific comment by ID
exports.getComment = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT c.*, 
             COUNT(f.id) as interesting_count,
             GROUP_CONCAT(f.user_id) as interesting_users
      FROM comments c
      LEFT JOIN interesting_flags f ON c.id = f.comment_id
      WHERE c.id = ?
      GROUP BY c.id
    `;
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        const comment = {
          id: row.id,
          postId: row.post_id,
          text: row.text,
          author: row.author || 'Anonymous',
          interestingCount: row.interesting_count,
          interestingUsers: row.interesting_users ? row.interesting_users.split(',') : [],
          createdAt: dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs(row.updated_at).format('YYYY-MM-DD HH:mm:ss')
        };
        resolve(comment);
      } else {
        resolve(null);
      }
    });
  });
};

// Create a new comment
exports.createComment = (postId, text, author = null) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO comments (post_id, text, author) VALUES (?, ?, ?)';
    db.run(sql, [postId, text, author], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
};

// Update a comment
exports.updateComment = (id, text) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE comments SET text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    db.run(sql, [text, id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes > 0);
      }
    });
  });
};

// Delete a comment and its interesting flags
exports.deleteComment = (id) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Delete interesting flags first
      db.run('DELETE FROM interesting_flags WHERE comment_id = ?', [id], (err) => {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }
        
        // Delete the comment
        db.run('DELETE FROM comments WHERE id = ?', [id], function(err) {
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
};

// Get comment count for a post
exports.getCommentCount = (postId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT COUNT(*) as count FROM comments WHERE post_id = ?';
    db.get(sql, [postId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count);
      }
    });
  });
};

// Toggle interesting flag for a comment
exports.toggleInteresting = (commentId, username) => {
  return new Promise((resolve, reject) => {
    // First check if the flag already exists
    const checkSql = 'SELECT id FROM interesting_flags WHERE comment_id = ? AND user_id = ?';
    db.get(checkSql, [commentId, username], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        // Flag exists, remove it
        const deleteSql = 'DELETE FROM interesting_flags WHERE comment_id = ? AND user_id = ?';
        db.run(deleteSql, [commentId, username], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ action: 'removed', changes: this.changes });
          }
        });
      } else {
        // Flag doesn't exist, add it
        const insertSql = 'INSERT INTO interesting_flags (comment_id, user_id) VALUES (?, ?)';
        db.run(insertSql, [commentId, username], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ action: 'added', id: this.lastID });
          }
        });
      }
    });
  });
};

// Get comments by author
exports.getCommentsByAuthor = (author) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT c.*, 
             p.title as post_title,
             COUNT(f.id) as interesting_count
      FROM comments c
      JOIN posts p ON c.post_id = p.id
      LEFT JOIN interesting_flags f ON c.id = f.comment_id
      WHERE c.author = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    db.all(sql, [author], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const comments = rows.map(row => ({
          id: row.id,
          postId: row.post_id,
          postTitle: row.post_title,
          text: row.text,
          author: row.author,
          interestingCount: row.interesting_count,
          createdAt: dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss'),
          updatedAt: dayjs(row.updated_at).format('YYYY-MM-DD HH:mm:ss')
        }));
        resolve(comments);
      }
    });
  });
};
