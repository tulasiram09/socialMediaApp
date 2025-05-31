const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/database');
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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/chat', require('./routes/chat'));

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