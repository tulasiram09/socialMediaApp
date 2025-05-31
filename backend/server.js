const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');

// Import models for debugging (add these lines)
const FriendRequest = require('./models/FriendRequest');
const User = require('./models/User');
const auth = require('./middleware/auth');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Debug middleware (add this for logging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/chat', require('./routes/chat'));

// Debug route (add this after your regular routes)
app.get('/api/debug/requests', auth, async (req, res) => {
  try {
    console.log('Debug: Fetching all friend requests');
    const requests = await FriendRequest.find({})
      .populate('sender', 'username email profilePicture')
      .populate('receiver', 'username email profilePicture')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${requests.length} friend requests`);
    res.json({ requests, count: requests.length });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Debug route for user's specific requests
app.get('/api/debug/my-requests', auth, async (req, res) => {
  try {
    console.log('Debug: Fetching requests for user:', req.user._id);
    
    const receivedRequests = await FriendRequest.find({ receiver: req.user._id })
      .populate('sender', 'username email profilePicture')
      .populate('receiver', 'username email profilePicture');
    
    const sentRequests = await FriendRequest.find({ sender: req.user._id })
      .populate('sender', 'username email profilePicture')
      .populate('receiver', 'username email profilePicture');
    
    console.log(`User has ${receivedRequests.length} received and ${sentRequests.length} sent requests`);
    
    res.json({ 
      received: receivedRequests, 
      sent: sentRequests,
      userId: req.user._id 
    });
  } catch (error) {
    console.error('Debug my-requests error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Socket.io for real-time chat
const users = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    users[userId] = socket.id;
    socket.join(userId);
  });

  socket.on('sendMessage', (data) => {
    const { receiverId, message, senderId } = data;
    if (users[receiverId]) {
      io.to(users[receiverId]).emit('receiveMessage', {
        senderId,
        message,
        timestamp: new Date()
      });
    }
  });

  socket.on('disconnect', () => {
    const userId = Object.keys(users).find(key => users[key] === socket.id);
    if (userId) {
      delete users[userId];
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});