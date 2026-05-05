const express = require('express');
const app = express();

const dotenv = require('dotenv');
const http = require('http');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

//http.createServer wraps your express App
//socket.io needs this raw http server later -that's the only reason we do this
const httpServer = http.createServer(app);

app.use(cors({ origin : 'http://localhost:5173', credentials: true}));
app.use(express.json());

//Routes (we'll add these next)
app.use('/api/auth', require('./routes/auth.routes'));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));