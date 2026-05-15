// server/socket/events/message.events.js

const Message = require('../../models/Message');
const redis = require('../../config/redis');

module.exports = (io, socket) => {

  socket.on('send_message', async (data) => {
    console.log(`📨 Message received from ${socket.user.username}:`, data);

    try {
      // 1. Save to MongoDB
      const message = await Message.create({
        room: data.roomId,
        sender: socket.user.userId,
        content: data.content,
        type: 'text'
      });

      await message.populate('sender', 'username avatar');

      // 2. Build the message object FIRST — used in both cache and emit
      const messageObj = {
        _id: message._id,
        content: message.content,
        sender: message.sender,
        room: data.roomId,
        createdAt: message.createdAt
      };

      // 3. Cache in Redis
      const cacheKey = `room:messages:${data.roomId}`; // ← "messages" not "message"
      await redis.lpush(cacheKey, JSON.stringify(messageObj));
      await redis.ltrim(cacheKey, 0, 49);   // ← cacheKey not cache
      await redis.expire(cacheKey, 86400);

      // 4. Broadcast ONCE — after cache is ready
      console.log('📡 Broadcasting to room:', data.roomId);
      io.to(data.roomId).emit('receive_message', messageObj);
      console.log('✅ Message sent and cached');

    } catch (err) {
      console.error('❌ FULL ERROR:', err.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing_start', async (roomId) => {
    await redis.set(
      `typing:${roomId}:${socket.user.userId}`,
      socket.user.username,
      'EX', 3
    );
    socket.to(roomId).emit('user_typing', {
      userId: socket.user.userId,
      username: socket.user.username
    });
  });

  socket.on('typing_stop', async (roomId) => {
    await redis.del(`typing:${roomId}:${socket.user.userId}`);
    socket.to(roomId).emit('user_stopped_typing', {
      userId: socket.user.userId
    });
  });
};