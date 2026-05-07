const {Server} = require('socket.io');
const jwt = require('jsonwebtoken');

//This function receives the httpServer we created in server.js
 //and attaches socket.io to it
 const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: 'http://localhost:5173',
            credentials: true
        }
    });

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
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.username} | socket ID: ${socket.id}`);

        //load message and room events user who successfully connects
        require('./events/message.events')(io, socket);
        require('./events/room.events')(io, socket);

        //-------------DISCONNECT--------------------
        socket.on('disconnect' , () =>{
            console.log(`user disconnected: ${socket.user.username}`);
        });
    });
    return io;
 };

 module.exports = initSocket;