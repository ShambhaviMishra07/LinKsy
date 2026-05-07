module.exports = (io, socket) => {

    //client emits this when they open a chat room
    socket.on('join_room', (roomId) => {

        //socket.join() adds this socket to a named group called roomId
        //after this, io.to(roomId).emit(...) will reach this socket
        socket.join(roomId);

        console.log(`${socket.user.username} joined room: ${roomId}`);

        //tell everyone else in the room that this user joined
        //socket.to() emits to everyone in the room except the sender

        socket.to(roomId).emit('user_joined', {
            userId: socket.user.userId,
            username: socket.user.username,
            message: `${socket.user.username} joined the room`
        });
    });

    //client emits his when they leave or switch rooms
    socket.on('leave_room', (roomId) => {
        socket.leave(roomId);
        console.log(`${socket.user.username} left room: ${roomId}`);
    });
};