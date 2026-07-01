
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [
          'http://localhost:5173',
          process.env.CLIENT_URL
        ];

        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
      },
      credentials: true
    }
  });

  // -------- SOCKET AUTH MIDDLEWARE --------
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: no token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = decoded;

      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  // -------- CONNECTION EVENT --------
 io.on('connection', async (socket) => {
  console.log(
    `User connected: ${socket.user.username} | Socket ID: ${socket.id}`
  );

  // Each user joins a personal room so we can send them direct socket events
  // without going through a chat room
  socket.join(`user:${socket.user.userId}`);
  console.log(`✅ User connected: ${socket.user.username}`);

  // Mark user online
  await redis.set(
    `user:online:${socket.user.userId}`,
    '1',
    'EX',
    60
  );

  io.emit('user_online', {
    userId: socket.user.userId
  });

  // Load events
  require('./events/message.events')(io, socket);
  require('./events/room.events')(io, socket);
  require('./events/sos.events')(io, socket);

  // Heartbeat
  const heartbeat = setInterval(async () => {
    await redis.expire(
      `user:online:${socket.user.userId}`,
      60
    );
  }, 30000);

    // Disconnect
    socket.on('disconnect', async () => {
      clearInterval(heartbeat);

      await redis.del(
        `user:online:${socket.user.userId}`
      );

      io.emit('user_offline', {
        userId: socket.user.userId
      });

      console.log(
        `❌ User disconnected: ${socket.user.username}`
      );
    });
  });

  return io;
};

module.exports = initSocket;