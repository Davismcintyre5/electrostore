const socketIo = require('socket.io');

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    // Join user-specific room for private notifications
    socket.on('join-user-room', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`👤 User ${userId} joined their room`);
      }
    });

    // Join admin room for global notifications
    socket.on('join-admin-room', () => {
      socket.join('admins');
      console.log('👑 Admin joined admin room');
    });

    // Join order room for real-time updates
    socket.on('join-order-room', (orderId) => {
      if (orderId) {
        socket.join(`order_${orderId}`);
        console.log(`📦 Joined order room: ${orderId}`);
      }
    });

    // Leave order room
    socket.on('leave-order-room', (orderId) => {
      if (orderId) {
        socket.leave(`order_${orderId}`);
        console.log(`📦 Left order room: ${orderId}`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Emit notification to specific user
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

// Emit notification to all admins
const emitToAdmins = (event, data) => {
  if (io) {
    io.to('admins').emit(event, data);
  }
};

// Emit notification to everyone
const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Emit to specific order room
const emitToOrder = (orderId, event, data) => {
  if (io) {
    io.to(`order_${orderId}`).emit(event, data);
  }
};

module.exports = { 
  initializeSocket, 
  getIO,
  emitToUser,
  emitToAdmins,
  emitToAll,
  emitToOrder
};