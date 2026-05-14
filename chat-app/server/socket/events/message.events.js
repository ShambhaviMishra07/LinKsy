const Message = require('../../models/Message');
const redis = require('../../config/redis');
const { cache } = require('react');

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

            //------CACHE MESSAGE IN REDIS-----------------
            //LPUSH = push to the left (front) of a list
            //we use list so wa can store multiple message per room
            //key pattern: "room:message:general", "room:message:random" etc

            const cacheKey = `room:message:${data.roomId}`;
            await redis.lpush(cacheKey, JSON.stringify(messageObj));

            //LTRIM = keep only items from index 0 to 49
            //this limits our cache to 50 messages per room
            //older messages beyond index 49 are automatically deleted
            await.redis.ltrim(cache,0 , 49);

            //set expiry -if nobody chats for 24 hours, cache clears itself
            await redis.expire(cacheKey, 86400);

            //broadcast to everyone in the room
            io.to(data.roomId).emit('receive_message', messageObj);
             console.log('✅ Message sent and cached');

        } catch (err){
            //if something fails tell only the sender
             console.error('❌ FULL ERROR:', err.message);
            socket.emit('error', {message :'failed to send message'});
        }
    });
     // Typing indicator — stored in redis with 3s auto-expiry
     //if the browser crashes mid-typing, redis clears it automatically
  socket.on('typing_start',async (roomId) => {
    await redis.set(
      `typing:${roomId}:${socket.user.userId}`,
      socket.user.username,
      'EX', 3  //auto deletes after 3 seconds
    )
    // Tell everyone else in the room that this user is typing
    socket.to(roomId).emit('user_typing', {
      userId: socket.user.userId,
      username: socket.user.username
    });
  });

  socket.on('typing_stop',async (roomId) => {
    await redis.del(`typing:${roomId}:${socket.user.userId}`);
    
    socket.to(roomId).emit('user_stopped_typing', {
      userId: socket.user.userId
    });
  });
}