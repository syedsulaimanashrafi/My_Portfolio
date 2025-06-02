'use strict';

const express = require('express');
const cors = require('cors');
const { check, validationResult } = require('express-validator');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const TotpStrategy = require('passport-totp').Strategy;
const session = require('express-session');
const base32 = require('thirty-two'); // Admin users need 2FA verification

const userDao = require('./dao-user');
const postDao = require('./dao-post');
const commentDao = require('./dao-comment');

// Initialize express
const app = express();
const port = 3001;

// Set up the middlewares
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Set up the session
app.use(session({
  secret: 'forum-secret-key-for-university-project',
  resave: false,
  saveUninitialized: false
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Set up the LocalStrategy for username and password
passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password'
}, async function verify(username, password, cb) {
  try {
    const user = await userDao.getUser(username, password);
    if (!user) {
      return cb(null, false, { message: 'Incorrect username or password.' });
    }
    return cb(null, user);
  } catch (err) {
    return cb(err);
  }
}));

// Set up the TOTP strategy
passport.use(new TotpStrategy(function(user, done) {
  // In case .secret does not exist, decode() will return an empty buffer
  return done(null, base32.decode(user.secret || 'LXBSMDTMSP2I5XFXIYRGFVWSFI'), 30);  // 30 = period of key validity
}));

// Serialize and deserialize user
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  userDao.getUserById(id)
    .then(user => {
      cb(null, user);
    }).catch(err => {
      cb(err, null);
    });
});

// Middleware to check if user is authenticated
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Not authenticated' });
};

// Middleware to check if user has TOTP
function isTotp(req, res, next) {
  if (req.session.method === 'totp') {
    return next();
  }
  return res.status(401).json({ error: 'Missing TOTP authentication' });
}

// Helper function for client user info
function clientUserInfo(req) {
  const user = req.user;
  return {
    id: user.id, 
    username: user.username, 
    name: user.name, 
    role: user.role,
    canDoTotp: user.secret ? true : false, 
    isTotp: req.session.method === 'totp'
  };
}

// Validation middleware
const postValidation = [
  check('title').notEmpty().withMessage('Title is required'),
  check('text').notEmpty().withMessage('Text is required'),
  check('maxComments').optional().isInt({ min: 0 }).withMessage('Max comments must be a positive integer')
];

const commentValidation = [
  check('text').notEmpty().withMessage('Comment text is required')
];

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Authentication routes
app.post('/api/sessions', function(req, res, next) {
  console.log('Login request body:', req.body);
  console.log('Request headers:', req.headers);
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.log('Passport error:', err);
      return next(err);
    }
    if (!user) {
      console.log('No user found, info:', info);
      return res.status(401).json(info);
    }
    req.login(user, (err) => {
      if (err)
        return next(err);
      return res.json(clientUserInfo(req));
    });
  })(req, res, next);
});

app.post('/api/login-totp', isLoggedIn,
  passport.authenticate('totp'),   // passport expects the totp value to be in: body.code
  function(req, res) {
    req.session.method = 'totp';
    res.json({otp: 'authorized'});
  }
);

app.delete('/api/sessions/current', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error during logout' });
    }
    res.status(200).json({ message: 'Logout successful' });
  });
});

app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.status(200).json(clientUserInfo(req));
  } else {
    res.status(401).json({ error: 'Unauthenticated user!' });
  }
});

// User routes
app.post('/api/users', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const userId = await userDao.createUser(username, password);
    res.status(201).json({ id: userId, username });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT') {
      res.status(409).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Post routes
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await postDao.getAllPosts();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving posts' });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await postDao.getPost(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving post' });
  }
});

app.post('/api/posts', isLoggedIn, postValidation, handleValidationErrors, async (req, res) => {
  try {
    const { title, text, maxComments } = req.body;
    const postId = await postDao.createPost(title, text, req.user.username, maxComments);
    const post = await postDao.getPost(postId);
    res.status(201).json(post);
  } catch (err) {
    if (err.message === 'Title already exists') {
      res.status(409).json({ error: 'A post with this title already exists' });
    } else {
      res.status(500).json({ error: 'Error creating post' });
    }
  }
});

app.put('/api/posts/:id', isLoggedIn, postValidation, handleValidationErrors, async (req, res) => {
  try {
    const { title, text, maxComments } = req.body;
    const post = await postDao.getPost(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if user owns the post or is admin
    if (post.author !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this post' });
    }
    
    // Admin users need 2FA verification
    if (req.user.role === 'admin' && req.session.method !== 'totp') {
      return res.status(403).json({ error: '2FA verification required', needs2FA: true });
    }
    
    await postDao.updatePost(req.params.id, title, text, maxComments);
    const updatedPost = await postDao.getPost(req.params.id);
    res.json(updatedPost);
  } catch (err) {
    if (err.message === 'Title already exists') {
      res.status(409).json({ error: 'A post with this title already exists' });
    } else {
      res.status(500).json({ error: 'Error updating post' });
    }
  }
});

app.delete('/api/posts/:id', isLoggedIn, async (req, res) => {
  try {
    const post = await postDao.getPost(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if user owns the post or is admin
    if (post.author !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }
    
    // Admin users need 2FA verification
    if (req.user.role === 'admin' && req.session.method !== 'totp') {
      return res.status(403).json({ error: '2FA verification required', needs2FA: true });
    }
    
    await postDao.deletePost(req.params.id);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting post' });
  }
});

// Comment routes
app.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    const comments = await commentDao.getCommentsByPost(req.params.postId);
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving comments' });
  }
});

app.post('/api/posts/:postId/comments', commentValidation, handleValidationErrors, async (req, res) => {
  try {
    const { text, author } = req.body;
    const postId = req.params.postId;
    
    // Check if post exists and has space for more comments
    const post = await postDao.getPost(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.maxComments) {
      const commentCount = await commentDao.getCommentCount(postId);
      if (commentCount >= post.maxComments) {
        return res.status(400).json({ error: 'Maximum number of comments reached' });
      }
    }
    
    const commentId = await commentDao.createComment(postId, text, author || null);
    const comment = await commentDao.getComment(commentId);
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Error creating comment' });
  }
});

app.put('/api/comments/:id', isLoggedIn, commentValidation, handleValidationErrors, async (req, res) => {
  try {
    const { text } = req.body;
    const comment = await commentDao.getComment(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user owns the comment or is admin
    if (comment.author !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this comment' });
    }
    
    // Admin users need 2FA verification
    if (req.user.role === 'admin' && req.session.method !== 'totp') {
      return res.status(403).json({ error: '2FA verification required', needs2FA: true });
    }
    
    await commentDao.updateComment(req.params.id, text);
    const updatedComment = await commentDao.getComment(req.params.id);
    res.json(updatedComment);
  } catch (err) {
    res.status(500).json({ error: 'Error updating comment' });
  }
});

app.delete('/api/comments/:id', isLoggedIn, async (req, res) => {
  try {
    const comment = await commentDao.getComment(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Check if user owns the comment or is admin
    if (comment.author !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    // Admin users need 2FA verification
    if (req.user.role === 'admin' && req.session.method !== 'totp') {
      return res.status(403).json({ error: '2FA verification required', needs2FA: true });
    }
    
    await commentDao.deleteComment(req.params.id);
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting comment' });
  }
});

// Interesting flag routes
app.post('/api/comments/:id/interesting', isLoggedIn, async (req, res) => {
  try {
    await commentDao.toggleInteresting(req.params.id, req.user.username);
    const comment = await commentDao.getComment(req.params.id);
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: 'Error toggling interesting flag' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Forum server listening at http://localhost:${port}`);
});
