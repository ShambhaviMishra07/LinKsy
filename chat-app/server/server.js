// server/server.js

require('dotenv').config(); // must be first line

const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const initSocket = require('./socket/socket');

connectDB();

const app = express();
const httpServer = http.createServer(app);

initSocket(httpServer);

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/rooms',    require('./routes/room.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/upload',   require('./routes/upload.routes'));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));