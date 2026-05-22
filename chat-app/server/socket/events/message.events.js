// server/socket/events/message.events.js

const Message = require('../../models/Message');
const redis = require('../../config/redis');

module.exports = (io, socket) => {

  socket.on('send_message', async (data) => {
    // data = { roomId, content, type }
    // type is either 'text' or 'image'
    console.log(`📨 Message from ${socket.user.username}:`, data);

    try {
      // 1. Save to MongoDB
      const message = await Message.create({
        room: data.roomId,
        sender: socket.user.userId,
        content: data.content,
        type: data.type || 'text'
      });

      await message.populate('sender', 'username avatar');

      // 2. Build message object
      const messageObj = {
        _id: message._id,
        content: message.content,
        type: message.type, // important for frontend image/text rendering
        sender: message.sender,
        room: data.roomId,
        createdAt: message.createdAt,
        seenBy: [] // nobody has seen it initially
      };

      // 3. Cache in Redis
      const cacheKey = `room:messages:${data.roomId}`;

      await redis.lpush(cacheKey, JSON.stringify(messageObj));
      await redis.ltrim(cacheKey, 0, 49);
      await redis.expire(cacheKey, 86400);

      // 4. Update room last message
      await require('../../models/Room').findByIdAndUpdate(data.roomId, {
        lastMessage: {
          content: data.type === 'image'
            ? '📷 Image'
            : data.content,
          sender: socket.user.username,
          createdAt: message.createdAt
        }
      });

      // 5. Broadcast message
      console.log('📡 Broadcasting to room:', data.roomId);

      io.to(data.roomId).emit('receive_message', messageObj);

      console.log('✅ Message sent and cached');

    } catch (err) {
      console.error('❌ Message error:', err.message);

      socket.emit('error', {
        message: 'Failed to send message'
      });
    }
  });

  // ── READ RECEIPTS ────────────────────────────────────────────
  socket.on('mark_seen', async (roomId) => {
    try {

      // Mark all unread messages as seen
      await Message.updateMany(
        {
          room: roomId,
          sender: { $ne: socket.user.userId },
          seenBy: { $nin: [socket.user.userId] }
        },
        {
          $addToSet: {
            seenBy: socket.user.userId
          }
        }
      );

      // Notify others in room
      socket.to(roomId).emit('messages_seen', {
        roomId,
        seenBy: socket.user.userId,
        username: socket.user.username
      });

    } catch (err) {
      console.error('Mark seen error:', err.message);
    }
  });

  socket.on('typing_start', async (roomId) => {
    await redis.set(
      `typing:${roomId}:${socket.user.userId}`,
      socket.user.username,
      'EX',
      3
    );

    socket.to(roomId).emit('user_typing', {
      userId: socket.user.userId,
      username: socket.user.username
    });
  });

  socket.on('typing_stop', async (roomId) => {
    await redis.del(
      `typing:${roomId}:${socket.user.userId}`
    );

    socket.to(roomId).emit('user_stopped_typing', {
      userId: socket.user.userId
    });
  });

};