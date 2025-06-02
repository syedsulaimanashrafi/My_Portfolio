# University Forum Application

A full-stack web application for university students and faculty to create and discuss posts, built with React frontend and Express/Node.js backend.

## Features

### Core Functionality
- **Posts Management**: Create, view, edit, and delete posts with unique titles
- **Comments System**: Add comments to posts (anonymous or authenticated)
- **User Authentication**: Login/logout with secure session management
- **Two-Factor Authentication**: TOTP-based 2FA for admin users
- **Authorization**: Role-based access control (regular users vs. administrators)
- **Interesting Comments**: Users can mark comments as "interesting"
- **Comment Limits**: Posts can have optional maximum comment limits

### User Roles
- **Regular Users**: Can create, edit, and delete their own posts and comments
- **Administrators**: Can manage all posts and comments (including anonymous ones), require 2FA for actions
- **Anonymous Users**: Can view posts and add anonymous comments

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **SQLite** database with custom DAO pattern
- **Passport.js** for authentication (LocalStrategy + TOTP)
- **crypto.scrypt** for password hashing with salt
- **express-validator** for input validation
- **CORS** configuration for cross-origin requests
- **express-session** for session management

### Frontend
- **React** 18 with Vite build tool
- **React Router** for client-side routing
- **React Bootstrap** for UI components
- **Bootstrap** 5 for styling
- **Custom CSS** for forum-specific styling

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm

### Backend Setup
```bash
cd server
npm ci           # Install dependencies
node init-db.js  # Initialize database with test data
nodemon index.js # Starts server on http://localhost:3001
```

### Frontend Setup
```bash
cd client
npm ci           # Install dependencies
npm run dev      # Starts development server on http://localhost:5173
```

## Test Accounts

The database is pre-populated with Iranian names to meet the project requirements:

### Regular Users
- **Username**: `reza` | **Password**: `password123`
- **Username**: `maryam` | **Password**: `password123`
- **Username**: `arash` | **Password**: `password123`

### Administrators
- **Username**: `admin_sara` | **Password**: `admin123` (requires 2FA)
- **Username**: `admin_ali` | **Password**: `admin456` (requires 2FA)
- **2FA Secret**: `LXBSMDTMSP2I5XFXIYRGFVWSFI` (Use in Google Authenticator)

> **Note**: Use the 2FA secret in Google Authenticator or similar TOTP app for admin login.

## API Endpoints

### Authentication
- `POST /api/sessions` - Login with username/password
- `POST /api/login-totp` - Verify TOTP for 2FA
- `GET /api/sessions/current` - Get current user info
- `DELETE /api/sessions/current` - Logout

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get specific post
- `POST /api/posts` - Create new post (authenticated)
- `PUT /api/posts/:id` - Update post (owner/admin)
- `DELETE /api/posts/:id` - Delete post (owner/admin)

### Comments
- `GET /api/posts/:postId/comments` - Get comments for post
- `POST /api/posts/:postId/comments` - Add comment to post
- `PUT /api/comments/:id` - Update comment (owner/admin)
- `DELETE /api/comments/:id` - Delete comment (owner/admin)
- `POST /api/comments/:id/interesting` - Toggle interesting flag

### Users
- `POST /api/users` - Create new user account

## React Application Routes

- `/` - Home page displaying all posts (PostList component)
- `/login` - User login form (LoginForm component)
- `/totp` - Two-factor authentication form (TotpForm component)
- `/posts/:id` - Individual post view with comments (PostDetail component)
- `/create` - Create new post form (CreatePost component) - requires authentication
- `/edit/:id` - Edit existing post form (EditPost component) - requires authentication
- `*` - Catch-all route redirects to home page

## React Components

### Main Components
- **App.jsx** - Main application component with routing and authentication state management
- **NavigationBar.jsx** - Top navigation bar with login/logout and user info
- **PostList.jsx** - Displays list of all posts with pagination
- **PostDetail.jsx** - Shows individual post with full content and comments
- **CreatePost.jsx** - Form for creating new posts with validation
- **EditPost.jsx** - Form for editing existing posts (owner/admin only)
- **LoginForm.jsx** - User authentication form with username/password
- **TotpForm.jsx** - Two-factor authentication TOTP code input form
- **LoadingSpinner.jsx** - Reusable loading indicator component

## Screenshot

![Create Post Page](./screenshot-create-post.png)
*Create Post page showing the form interface for authenticated users to create new posts*

## Database Schema

### Users Table
- `id` (PRIMARY KEY, AUTO INCREMENT)
- `username` (UNIQUE, NOT NULL)
- `password` (HASHED, NOT NULL)
- `salt` (NOT NULL) - Random salt for password hashing
- `secret` (NULLABLE) - TOTP secret for 2FA
- `role` (DEFAULT 'user')
- `created_at` (TIMESTAMP)

### Posts Table
- `id` (PRIMARY KEY, AUTO INCREMENT)
- `title` (UNIQUE, NOT NULL)
- `text` (NOT NULL)
- `author` (FOREIGN KEY to users.username)
- `max_comments` (OPTIONAL)
- `created_at`, `updated_at` (TIMESTAMPS)

### Comments Table
- `id` (PRIMARY KEY, AUTO INCREMENT)
- `post_id` (FOREIGN KEY to posts.id)
- `text` (NOT NULL)
- `author` (NULLABLE for anonymous comments)
- `created_at`, `updated_at` (TIMESTAMPS)

### Interesting Flags Table
- `id` (PRIMARY KEY, AUTO INCREMENT)
- `comment_id` (FOREIGN KEY to comments.id)
- `user_id` (FOREIGN KEY to users.username)
- `created_at` (TIMESTAMP)
- UNIQUE constraint on (comment_id, user_id)

## Security Features

1. **Password Hashing**: crypto.scrypt with random salt generation
2. **Session Management**: Secure HTTP-only cookies
3. **Input Validation**: Server-side validation with express-validator
4. **SQL Injection Prevention**: Parameterized queries
5. **CORS Configuration**: Restricted to frontend origin
6. **Two-Factor Authentication**: Time-based OTP for admin users
7. **Role-based Authorization**: Different permissions for users and admins

## Key Design Patterns

### Backend Patterns
- **DAO Pattern**: Separate data access objects for users, posts, and comments
- **Middleware Pattern**: Authentication, validation, and error handling
- **Strategy Pattern**: Passport.js authentication strategies
- **Transaction Pattern**: Database operations with rollback support

### Frontend Patterns
- **Component-based Architecture**: Reusable React components
- **Custom Hooks**: Centralized API calls
- **Protected Routes**: Authentication-based routing
- **Form Validation**: Client and server-side validation
- **Error Boundaries**: Graceful error handling

## Features Demonstration

1. **Anonymous Browsing**: View posts and comments without login
2. **User Registration/Login**: Create account and authenticate
3. **Post Creation**: Write posts with optional comment limits
4. **Comment System**: Add comments (anonymous or authenticated)
5. **Interesting Comments**: Mark and view interesting comments
6. **Content Management**: Edit/delete own content
7. **Admin Features**: Manage all content with 2FA requirement
8. **Responsive Design**: Works on desktop and mobile devices

## Development Notes

- Follows professor's patterns from existing lab exercises
- Uses React Bootstrap for consistent UI components
- Implements chronological ordering (both posts and comments newest first)
- Supports both authenticated and anonymous interactions
- Includes comprehensive error handling and user feedback
- Database is pre-populated with sample data for testing

## Future Enhancements

- File upload support for posts
- Email notifications for replies
- Advanced search and filtering
- User profiles and avatars
- Moderation tools for admins
- Real-time updates with WebSockets
