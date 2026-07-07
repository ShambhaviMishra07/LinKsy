
// server/socket/events/message.events.js

const Message = require('../../models/Message');
const Room = require('../../models/Room');
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
        type: data.type || 'text'
      });

      const room = await Room.findById(data.roomId);

    if (room) {
      room.members.forEach(memberId => {
        const id = memberId.toString();

        if (id !== socket.user.userId) {
          const current = room.unreadCounts.get(id) || 0;
          room.unreadCounts.set(id, current + 1);
        }
      });

      await room.save();
      for (const memberId of room.members) {
    const id = memberId.toString();

    if (id !== socket.user.userId) {
      const allRooms = await Room.find({
        $or: [
          { isPrivate: false },
          { isPrivate: true, members: id }
        ]
      });

      let total = 0;

      allRooms.forEach(r => {
        total += r.unreadCounts?.get(id) || 0;
      });

      io.to(`user:${id}`).emit('unread_messages_count', {
        count: total
      });
    }
  }
}


      await message.populate('sender', 'username avatar');




      // 🔍 LOG 2 — Who is in this room right now?
      const roomSockets = await io.in(data.roomId).fetchSockets();
      console.log(`👥 Sockets in room "${data.roomId}":`, roomSockets.map(s => s.user.username));




      // 2. Build the message object FIRST — used in both cache and emit
      const messageObj = {
        _id: message._id,
        content: message.content,
         type: message.type,
        sender: message.sender,
        room: data.roomId,
        createdAt: message.createdAt,
        seenBy: [] 
      };

      // 3. Cache in Redis
      const cacheKey = `room:messages:${data.roomId}`; // ← "messages" not "message"
      await redis.lpush(cacheKey, JSON.stringify(messageObj));
      await redis.ltrim(cacheKey, 0, 49);   // ← cacheKey not cache
      await redis.expire(cacheKey, 86400);


          // Also update the room's lastMessage field in MongoDB
      // This powers the sidebar preview
      await require('../../models/Room').findByIdAndUpdate(data.roomId, {
        lastMessage: {
          content: data.type === 'image' ? '📷 Image' : data.content,
          sender: socket.user.username,
          createdAt: message.createdAt
        }
      });

      // 4. Broadcast ONCE — after cache is ready
       console.log(`📡 Broadcasting to room "${data.roomId}"`);



      io.to(data.roomId).emit('receive_message', messageObj);
      console.log('✅ Message sent and cached');

    } catch (err) {
      console.error('❌ FULL ERROR:', err.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

   // ── READ RECEIPTS ────────────────────────────────────────────
  // Client emits this when they open a room and view messages
  socket.on('mark_seen', async (roomId) => {
    try {
      // Update MongoDB — mark all messages as seen by this user
      await Message.updateMany(
        {
          room: roomId,
          sender: { $ne: socket.user.userId },
          seenBy: { $nin: [socket.user.userId] }
        },
        { $addToSet: { seenBy: socket.user.userId } }
      );

      // Tell everyone in the room that this user has seen the messages
      // The sender's UI will update their tick from ✓ to ✓✓
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
