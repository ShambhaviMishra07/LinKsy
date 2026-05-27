const {Server} = require('socket.io');
const {createAdapter} = require('@socket.io/redis-adapter');
const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

//This function receives the httpServer we created in server.js
 //and attaches socket.io to it
 const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: (origin, callback) =>{
                const allowedOrigins = [
                    'http://localhost:5173',
                    process.env.CLIENT_URL
                ];
                if(!origin || allowedOrigins.includes(origin)){
                    return callback(null, true);
                }
                callback(new Error('Not allowed by CORS'));
            },
            credentials: true
        }
    });

    //Redis needs TWO separate connections
    //one for publishing events, one for subscribing to them
    //this is a redis protocol requirement 
    const pubClient = redis;
    const subClient = redis.duplicate();//second independent connection

    //attach adapter - now if you run 2 servers ,all socket events
    //are synced through redis automatically
    io.adapter(createAdapter(pubClient, subClient));


    //------AUTH MIDDLEWARE FOR SOCKETS
    //this runs before any socket connection is accepted
    //its the same idea as your auth.middleware.js for REST routes
    // but for websocket connections instead
    io.use((socket, next) => {
        try{
            //the client sends the token during the handshake(connection setup)
            //socket.handshake.auth.token is where we told the client to put it
            const token = socket.handshake.auth.token;

            if(!token){
                //calling next() with an error rejects the connection entirely
                return next(new Error('authentication error: no token'));

            }
            //verify the JWT- same function you used in rest middleware
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            //attach user info to the socket object
            //now every event handler on this socket can acess socket.user
            socket.user= decoded;

            next(); // connection is approved, proceed
        } catch (err){
            next(new Error('authentication error: invalid token'));
        }
    });
    
    //------------CONNECTION EVENT-----------------
    //this fires once for every user who successfully connects
    io.on('connection',async (socket) => {
        console.log(`User connected: ${socket.user.username} | socket ID: ${socket.id}`);

     //------MARK USER ONLINE IN REDIS-----------------
     //SET key value ex seconds
     //EX 60 = this key auto deletes after 60 seconds
     //we refresh it evey 30s via heartbeat to keep it alive
     //if socket dies without sending disconnect, key expires on its own
     await redis.set(
        `user:online:${socket.user.userId}`,
        '1',
        'EX', 60
     );

     //tell all connected clients this user is online now
     io.emit('user_online', {userId: socket.user.userId});

        //load message and room events user who successfully connects
        require('./events/message.events')(io, socket);
        require('./events/room.events')(io, socket);

        //--------------HEARTBEAT----------------------
        //every 30s, reset the time to live back to 60s
        //this keeps the key alive as long as the socket is connected
        //setInterval return an ID so we can cancel it on disconnect
        const heartbeat = setInterval(async () => {
            await redis.expire(`user: online:${socket.user.userId}`,60);
        }, 30000);

        //-------------DISCONNECT--------------------
       socket.on('disconnect',async () => {
        clearInterval(heartbeat); //stop the heartbeat

        //delete the online key immediately 
        await redis.del(`user:online.${socket.user.userId}`);

        //tell everyone this user went offline
        io.emit('user_offline', {userId: socket.user.userId });

        console.log(`❌ User disconnected: ${socket.user.username}`);
       });
    });
    return io;
};

 module.exports = initSocket;