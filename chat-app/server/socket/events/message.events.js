const Message = require('../../models/Message');

module.exports = (io, socket) => {
    //client emits this when user hits send
    socket.on('send_message', async (data) =>{
        //data = {roomId , content} sent form the frontend

         console.log(`📨 Message received from ${socket.user.username}:`, data);




         console.log('📡 Broadcasting to room:', data.roomId);





         
        try{
            //1. save the message permanently to mongoDB
            //even if someone is offline, they'll see it when they come back
            const message = await Message.create({
                room: data.roomId,
                sender: socket.user.userId,
                content: data.content,
                type:'text'
            });

            //2. populate sender info so frontend gets username + avatar
            await message.populate('sender', 'username avatar');

            //3. broadcast to everyone in the room (including sender)
            // io.to() vs socket.to():
            //io.to(room) -> sends to all in room including sender
            //socket.to(room) -> sends to all except sender
            //for messages, we want the sender to also receive it
            //(confirms delievery and keep UI consistent)
            io.to(data.roomId).emit('receive_message', {
                _id: message._id,
                content: message.content,
                sender: message.sender,
                room: data.roomId,
                createdAt: message.createdAt
            });
             console.log('✅ Message broadcasted successfully');
        } catch (err){
            //if something fails tell only the sender
             console.error('❌ FULL ERROR:', err);
            socket.emit('error', {message :'failed to send message'});
        }
    });
     // Typing indicator — lightweight, no DB save needed
  socket.on('typing_start', (roomId) => {
    // Tell everyone else in the room that this user is typing
    socket.to(roomId).emit('user_typing', {
      userId: socket.user.userId,
      username: socket.user.username
    });
  });

  socket.on('typing_stop', (roomId) => {
    socket.to(roomId).emit('user_stopped_typing', {
      userId: socket.user.userId
    });
  });
}