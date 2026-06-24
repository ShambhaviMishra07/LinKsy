// server/socket/events/room.events.js

module.exports = (io, socket) => {

  // client emits this when opening a room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);

    console.log(`${socket.user.username} joined room: ${roomId}`);

    // Tell everyone else in the room that this user joined
    socket.to(roomId).emit('user_joined', {
      userId: socket.user.userId,
      username: socket.user.username,
      message: `${socket.user.username} joined the room`
    });
  });

  // client emits this when they leave or switch rooms
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`${socket.user.username} left room: ${roomId}`);
  });

};