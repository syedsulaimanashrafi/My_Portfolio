'use strict';

console.log('Starting database initialization...');

const userDao = require('./dao-user');
const postDao = require('./dao-post');
const commentDao = require('./dao-comment');

async function initializeDatabase() {
  try {
    console.log('Initializing database with test data...');
    
    // Create admin users
    try {
      await userDao.createAdminUser('admin_sara', 'admin123');
      console.log('Admin user created: admin_sara/admin123');
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        console.log('Admin user admin_sara already exists');
      } else {
        throw err;
      }
    }
    
    try {
      await userDao.createAdminUser('admin_ali', 'admin456');
      console.log('Admin user created: admin_ali/admin456');
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        console.log('Admin user admin_ali already exists');
      } else {
        throw err;
      }
    }
    
    // Create regular users
    const users = [
      { username: 'reza', password: 'password123' },
      { username: 'maryam', password: 'password123' },
      { username: 'arash', password: 'password123' }
    ];
    
    for (const user of users) {
      try {
        await userDao.createUser(user.username, user.password);
        console.log(`User created: ${user.username}/${user.password}`);
      } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT') {
          console.log(`User ${user.username} already exists`);
        } else {
          throw err;
        }
      }
    }
    
    // Create sample posts - EXAM REQUIREMENTS:
    // Four users (including two administrators) should have published two posts each
    // One user and one administrator should have posts which have 1 less comment than the allowed maximum
    const posts = [
      // ADMIN_SARA posts (2 posts) - admin_sara should have 1 post with maxComments-1
      {
        title: 'Welcome to the University Forum',
        text: 'This is the official university forum where students and faculty can discuss various topics. Please be respectful and follow the community guidelines.',
        author: 'admin_sara',
        maxComments: 5 // Will have 4 comments (maxComments-1)
      },
      {
        title: 'Forum Rules and Guidelines',
        text: 'Please read these important rules before posting. Be respectful, stay on topic, and help create a positive learning environment for everyone.',
        author: 'admin_sara',
        maxComments: 3 // Will have variety of comments
      },
      
      // ADMIN_ALI posts (2 posts)
      {
        title: 'Administrative Announcements',
        text: 'This is where we will post important administrative announcements and updates about the forum and university policies.',
        author: 'admin_ali',
        maxComments: 4 // Will have variety of comments
      },
      {
        title: 'Campus Technology Updates',
        text: 'Information about upcoming technology changes, new software available to students, and IT support resources.',
        author: 'admin_ali',
        maxComments: 6 // Will have variety of comments
      },
      
      // REZA posts (2 posts) - reza should have 1 post with maxComments-1
      {
        title: 'Study Group for Computer Science',
        text: 'Looking for fellow computer science students to form a study group for the upcoming algorithms exam. We can meet weekly to review materials and practice problems together.',
        author: 'reza',
        maxComments: 4 // Will have 3 comments (maxComments-1)
      },
      {
        title: 'Programming Project Ideas',
        text: 'Sharing some interesting programming project ideas for those looking to build their portfolio. Feel free to collaborate!',
        author: 'reza',
        maxComments: 5 // Will have variety of comments
      },
      
      // MARYAM posts (2 posts)
      {
        title: 'Campus Event: Tech Talk Series',
        text: 'The Computer Science department is hosting a tech talk series this semester. Industry professionals will share their experiences and insights. Check the schedule on the department website.',
        author: 'maryam',
        maxComments: 3 // Will have variety of comments
      },
      {
        title: 'Internship Opportunities in Tech',
        text: 'I found some great internship opportunities and wanted to share them with fellow students. Let me know if you need help with applications!',
        author: 'maryam',
        maxComments: 4 // Will have variety of comments
      },
      
      // Additional posts by ARASH (no specific requirements)
      {
        title: 'Need Help with Database Design',
        text: 'I\'m working on my database design project and struggling with normalization. Can anyone recommend good resources or offer some guidance?',
        author: 'arash',
        maxComments: null // No limit
      },
      {
        title: 'Web Development Best Practices',
        text: 'Let\'s discuss modern web development best practices. What frameworks and tools are you using for your projects? Any recommendations for beginners?',
        author: 'arash',
        maxComments: null // No limit
      }
    ];
    
    const postIds = [];
    for (const post of posts) {
      try {
        const postId = await postDao.createPost(post.title, post.text, post.author, post.maxComments);
        postIds.push(postId);
        console.log(`Post created: "${post.title}" by ${post.author}`);
      } catch (err) {
        if (err.message === 'Title already exists') {
          console.log(`Post "${post.title}" already exists`);
          // Get the existing post ID
          const existingPosts = await postDao.getAllPosts();
          const existingPost = existingPosts.find(p => p.title === post.title);
          if (existingPost) {
            postIds.push(existingPost.id);
          }
        } else {
          throw err;
        }
      }
    }
    
    // Create sample comments - EXAM REQUIREMENTS:
    // One admin and one user must have posts with exactly 1 less comment than maxComments
    const comments = [
      // Comments for "Welcome to the University Forum" (admin_sara post with maxComments=5, needs 4 comments)
      {
        postId: 0, // Will be replaced with actual postId
        text: 'Thanks for setting up this forum! Looking forward to engaging discussions.',
        author: 'reza'
      },
      {
        postId: 0,
        text: 'Great initiative! This will be very helpful for connecting with other students.',
        author: 'maryam'
      },
      {
        postId: 0,
        text: 'Awesome! Finally a place where we can collaborate effectively.',
        author: 'arash'
      },
      {
        postId: 0,
        text: 'Looking forward to productive discussions here!',
        author: null // Anonymous comment
      },
      
      // Comments for "Forum Rules and Guidelines" (admin_sara post with maxComments=3, gets 2 comments)
      {
        postId: 1,
        text: 'Clear guidelines help maintain a good community atmosphere.',
        author: 'arash'
      },
      {
        postId: 1,
        text: 'Thanks for laying out these expectations clearly.',
        author: 'maryam'
      },
      
      // Comments for "Administrative Announcements" (admin_ali post with maxComments=4, gets 3 comments)
      {
        postId: 2,
        text: 'Will there be regular updates posted here?',
        author: 'reza'
      },
      {
        postId: 2,
        text: 'Good to have a dedicated space for official announcements.',
        author: 'maryam'
      },
      {
        postId: 2,
        text: 'This will help us stay informed about important changes.',
        author: null
      },
      
      // Comments for "Campus Technology Updates" (admin_ali post with maxComments=6, gets 4 comments)
      {
        postId: 3,
        text: 'Are there any new software licenses available for students?',
        author: 'arash'
      },
      {
        postId: 3,
        text: 'The new campus WiFi improvements are great!',
        author: 'maryam'
      },
      {
        postId: 3,
        text: 'When will the library computers be upgraded?',
        author: 'reza'
      },
      {
        postId: 3,
        text: 'Thanks for keeping us updated on tech changes.',
        author: null
      },
      
      // Comments for "Study Group for Computer Science" (reza post with maxComments=4, needs exactly 3 comments)
      {
        postId: 4,
        text: 'I\'m interested! I\'m particularly struggling with dynamic programming concepts.',
        author: 'maryam'
      },
      {
        postId: 4,
        text: 'Count me in! We could meet at the library study rooms.',
        author: 'arash'
      },
      {
        postId: 4,
        text: 'I\'d like to join too. I have some good practice problems we could work on.',
        author: null
      },
      
      // Comments for "Programming Project Ideas" (reza post with maxComments=5, gets 3 comments)
      {
        postId: 5,
        text: 'I\'ve been working on a web scraping project. Happy to collaborate!',
        author: 'arash'
      },
      {
        postId: 5,
        text: 'Mobile app development could be interesting to explore.',
        author: 'admin_ali'
      },
      {
        postId: 5,
        text: 'Machine learning projects are very popular with employers.',
        author: null
      },
      
      // Comments for "Campus Event: Tech Talk Series" (maryam post with maxComments=3, gets 2 comments)
      {
        postId: 6,
        text: 'When is the first talk scheduled? This sounds really interesting.',
        author: 'reza'
      },
      {
        postId: 6,
        text: 'Will these talks be recorded? Some of us might have schedule conflicts.',
        author: 'arash'
      },
      
      // Comments for "Internship Opportunities in Tech" (maryam post with maxComments=4, gets 3 comments)
      {
        postId: 7,
        text: 'Could you share the application deadlines for these positions?',
        author: 'arash'
      },
      {
        postId: 7,
        text: 'I\'m particularly interested in backend development roles.',
        author: 'admin_sara'
      },
      {
        postId: 7,
        text: 'Thanks for sharing these opportunities!',
        author: null
      },
      
      // Comments for "Need Help with Database Design" (arash post, no maxComments limit)
      {
        postId: 8,
        text: 'I recommend \"Database System Concepts\" by Silberschatz. Chapter 7 covers normalization really well.',
        author: 'maryam'
      },
      {
        postId: 8,
        text: 'Also check out the online tutorials on 3NF and BCNF. Visual examples help a lot!',
        author: 'reza'
      },
      {
        postId: 8,
        text: 'Happy to help! I just finished my database course last semester.',
        author: 'admin_sara'
      },
      
      // Comments for "Web Development Best Practices" (arash post, no maxComments limit)
      {
        postId: 9,
        text: 'I\'ve been using React with Node.js. The ecosystem is great and there\'s lots of community support.',
        author: 'reza'
      },
      {
        postId: 9,
        text: 'Vue.js is also worth considering, especially for beginners. It has a gentler learning curve.',
        author: 'maryam'
      },
      {
        postId: 9,
        text: 'Don\'t forget about testing! Jest and Cypress are essential tools.',
        author: 'admin_ali'
      }
    ];
    
    const commentIds = [];
    for (const comment of comments) {
      try {
        // Use the actual postId from the array based on comment.postId index
        const actualPostId = postIds[comment.postId];
        if (actualPostId) {
          const commentId = await commentDao.createComment(
            actualPostId, 
            comment.text, 
            comment.author
          );
          commentIds.push(commentId);
          const authorName = comment.author || 'Anonymous';
          console.log(`Comment created on post ${actualPostId} by ${authorName}: "${comment.text.substring(0, 50)}..."`);
        }
      } catch (err) {
        console.error('Error creating comment:', err.message);
      }
    }
    
    // Add some interesting flags
    if (commentIds.length > 0) {
      try {
        // Users mark some comments as interesting
        await commentDao.toggleInteresting(commentIds[0], 'maryam');
        await commentDao.toggleInteresting(commentIds[0], 'arash');
        await commentDao.toggleInteresting(commentIds[3], 'reza');
        await commentDao.toggleInteresting(commentIds[5], 'maryam');
        await commentDao.toggleInteresting(commentIds[8], 'arash');
        console.log('Interesting flags added to some comments');
      } catch (err) {
        console.error('Error adding interesting flags:', err.message);
      }
    }
    
    console.log('\n=== Database Initialization Complete ===');
    console.log('\nTest Accounts:');
    console.log('Admin: admin_sara / admin123 (requires 2FA)');
    console.log('Admin: admin_ali / admin456 (requires 2FA)');
    console.log('Users: reza / password123');
    console.log('       maryam / password123');
    console.log('       arash / password123');
    console.log('\n2FA Secret: LXBSMDTMSP2I5XFXIYRGFVWSFI');
    console.log('(Use this secret in a TOTP app like Google Authenticator)');
    
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Run initialization
initializeDatabase();
