// server/server.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');        // ← built into Node, no install needed
const connectDB = require('./config/db');
const initSocket = require('./socket/socket');

dotenv.config();
connectDB();

const app = express();

// http.createServer wraps your Express app
// Socket.io needs this raw HTTP server later — that's the only reason we do this
const httpServer = http.createServer(app);

initSocket(httpServer);

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes (we'll add these next)
app.use('/api/auth', require('./routes/auth.routes'));

app.use('/api/messages', require('./routes/message.routes'));

console.log("MONGO_URI:", process.env.MONGO_URI);

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));