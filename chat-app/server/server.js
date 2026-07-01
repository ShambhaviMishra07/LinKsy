// server/server.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const initSocket = require('./socket/socket');

connectDB();

const app = express();
const httpServer = http.createServer(app);

// Allow both local dev and production frontend
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL  // your Vercel URL goes here after deploying frontend
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

initSocket(httpServer);

app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/rooms',    require('./routes/room.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.use('/api/upload',   require('./routes/upload.routes'));
app.use('/api/follow', require('./routes/follow.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/moments', require('./routes/moment.routes'));
app.use('/api/sos', require('./routes/sos.routes'));

// Health check route — Railway uses this to verify your server is alive
// app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));