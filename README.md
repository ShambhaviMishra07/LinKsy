# LinKsy — Real-Time Chat Application

## Summary

LinKsy is a production-grade real-time chat application where messages deliver instantly without page refresh. Users can register, create public chat rooms or private DMs, share images, and see live typing indicators and read receipts. Built on Node.js, React, Socket.io, MongoDB, and Redis — it implements JWT authentication for both REST APIs and WebSocket handshakes, Redis caching for sub-millisecond message loads, and Cloudinary for image storage. Deployed with Railway (backend), Upstash (Redis), and Vercel (frontend), LinKsy demonstrates the architecture patterns used in production messaging systems.

---

## Live Demo

🌐 **Frontend:** [linksy-chat.vercel.app](https://linksy-chat.vercel.app)  
🚀 **Backend:** [linksy-server.up.railway.app](https://linksy-server.up.railway.app/health)

> **Test credentials** — or register your own:  
> User 1: `alice@test.com` / `123456`  
> User 2: `bob@test.com` / `123456`

---

## Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Secure register/login with bcrypt hashing and token-based sessions |
| ⚡ **Real-time Messaging** | Instant message delivery via Socket.io WebSockets |
| 🏠 **Chat Rooms** | Create and join public rooms with live sidebar previews |
| 🔒 **Private DMs** | One-on-one direct messaging between any two users |
| ✓✓ **Read Receipts** | Single tick (sent) updates to double tick (seen) in real time |
| ⌨️ **Typing Indicators** | Live "X is typing..." with Redis-backed auto-expiry |
| 📷 **Image Sharing** | Upload and share images via Cloudinary CDN |
| 🟢 **Online Presence** | Live online/offline status with Redis TTL heartbeat |
| 📦 **Message Caching** | Last 50 messages cached in Redis for instant room loads |
| 📜 **Message History** | Paginated history from MongoDB on cache miss |

---

## Technology Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API server and HTTP layer |
| **Socket.io** | WebSocket server for real-time bidirectional communication |
| **MongoDB + Mongoose** | Permanent storage for users, rooms, and messages |
| **Redis (ioredis)** | Message caching, online presence, typing state, pub/sub adapter |
| **JWT (jsonwebtoken)** | Stateless authentication for REST routes and socket handshakes |
| **bcryptjs** | Password hashing with salt rounds |
| **Multer + Cloudinary** | File upload middleware and cloud image storage |
| **@socket.io/redis-adapter** | Enables horizontal scaling across multiple server instances |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI component library |
| **React Router v6** | Client-side routing and protected routes |
| **Socket.io-client** | WebSocket client with auto-reconnection |
| **Axios** | HTTP client with JWT interceptor |
| **Context API** | Global socket and auth state management |
| **Vite** | Frontend build tool |

### Infrastructure
| Service | Purpose |
|---|---|
| **Railway** | Backend hosting with WebSocket support |
| **Upstash** | Serverless Redis with TLS |
| **MongoDB Atlas** | Cloud MongoDB database |
| **Vercel** | Frontend hosting with global CDN |
| **Cloudinary** | Image CDN and transformation |

---

## Project Structure

```
chat-app/
├── server/                         # Express + Socket.io backend
│   ├── config/
│   │   ├── db.js                   # MongoDB connection
│   │   ├── redis.js                # Redis connection (local + Upstash)
│   │   └── cloudinary.js           # Cloudinary + Multer setup
│   ├── models/
│   │   ├── User.js                 # User schema
│   │   ├── Room.js                 # Room schema (public + private DMs)
│   │   └── Message.js              # Message schema with seenBy array
│   ├── routes/
│   │   ├── auth.routes.js          # POST /register, POST /login
│   │   ├── room.routes.js          # GET/POST /rooms, POST /rooms/dm/:id
│   │   ├── message.routes.js       # GET /messages/:roomId, POST /seen
│   │   └── upload.routes.js        # POST /upload (Cloudinary)
│   ├── middleware/
│   │   └── auth.middleware.js      # JWT verification middleware
│   ├── socket/
│   │   ├── socket.js               # Socket.io init, Redis adapter, presence
│   │   └── events/
│   │       ├── message.events.js   # send_message, mark_seen, typing
│   │       └── room.events.js      # join_room, leave_room
│   ├── server.js                   # Entry point
│   └── .env                        # Environment variables (never commit)
│
└── client/                         # React frontend
    └── src/
        ├── api/
        │   └── axios.js            # Axios instance with JWT interceptor
        ├── context/
        │   └── SocketContext.jsx   # Global socket connection provider
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   └── Chat.jsx            # Main chat UI with sidebar
        └── App.jsx                 # Routes + ProtectedRoute guard
```

---

## Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│  SocketContext → useSocket hook → Chat.jsx components           │
└────────────────────┬───────────────────┬────────────────────────┘
                     │ WebSocket          │ REST (Axios + JWT)
                     ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│               SERVER (Express + Socket.io)                      │
│  JWT Middleware → Routes → Socket Events → Redis Adapter        │
└──────────┬──────────────────┬───────────────────────────────────┘
           │                  │
           ▼                  ▼
    ┌─────────────┐    ┌──────────────────────────────────┐
    │  MongoDB    │    │  Redis                           │
    │  • Users    │    │  • user:online:{id}  (TTL 60s)   │
    │  • Rooms    │    │  • room:messages:{id} (cache)    │
    │  • Messages │    │  • typing:{room}:{id} (TTL 3s)   │
    └─────────────┘    └──────────────────────────────────┘
```

### Message Flow (what happens when you hit Send)

```
1. User types message → hits Enter
2. Frontend emits  →  socket.emit('send_message', { roomId, content, type })
3. Server receives →  saves to MongoDB
4. Server caches   →  LPUSH to Redis list (max 50 items)
5. Server updates  →  Room.lastMessage for sidebar preview
6. Server emits    →  io.to(roomId).emit('receive_message', messageObj)
7. All clients     →  receive_message listener fires → setMessages(prev => [...prev, msg])
8. React renders   →  message appears on screen
   Total time: < 50ms
```

### Authentication Flow

```
Register/Login → bcrypt hash → JWT created (7 day expiry)
     ↓
Token stored in localStorage
     ↓
Every REST request → Axios interceptor adds  Authorization: Bearer <token>
Every Socket conn  → io(url, { auth: { token } }) → server verifies on handshake
     ↓
Protected routes/sockets → jwt.verify() → req.user / socket.user available
```

---

## Getting Started (Local Setup)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local installation)
- Cloudinary account (free)

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/linksy-chat.git
cd linksy-chat
```

### 2. Set up the backend
```bash
cd server
npm install
```

Create `server/.env`:
```env
MONGO_URI=mongodb://127.0.0.1:27017/LinKsy_chatApp
JWT_SECRET=your_long_random_secret_here
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
PORT=5000
```

```bash
npm run dev   # starts with nodemon
```

### 3. Set up the frontend
```bash
cd ../client
npm install
```

Create `client/.env.local`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

```bash
npm run dev   # starts on localhost:5173
```

### 4. Verify everything is running
```bash
# Backend terminal should show:
✅ Redis connected
✅ MongoDB connected
🚀 Server running on port 5000

# Open localhost:5173 — register two users in different browsers
# Send a message — it should appear instantly in both windows
```

---

## API Reference

### Auth Routes
```
POST  /api/auth/register     { username, email, password }  →  { token, user }
POST  /api/auth/login        { email, password }            →  { token, user }
```

### Room Routes *(JWT required)*
```
GET   /api/rooms                    →  [ ...rooms ]
POST  /api/rooms                    { name, description }  →  room
POST  /api/rooms/:id/join           →  { message }
POST  /api/rooms/dm/:targetUserId   →  room (new or existing)
```

### Message Routes *(JWT required)*
```
GET   /api/messages/:roomId         →  { source: 'cache'|'db', messages }
POST  /api/messages/:roomId/seen    →  { message: 'Marked as seen' }
```

### Upload Routes *(JWT required)*
```
POST  /api/upload    multipart/form-data  { image: File }  →  { url, publicId }
```

### Socket Events
```
Client → Server:
  join_room       (roomId)
  leave_room      (roomId)
  send_message    ({ roomId, content, type })
  mark_seen       (roomId)
  typing_start    (roomId)
  typing_stop     (roomId)

Server → Client:
  receive_message   (messageObj)
  messages_seen     ({ roomId, seenBy, username })
  user_joined       ({ userId, username, message })
  user_online       ({ userId })
  user_offline      ({ userId })
  user_typing       ({ userId, username })
  user_stopped_typing ({ userId })
```

---

## Deployment

| Service | Platform | Config |
|---|---|---|
| Backend | Railway | Root: `server/`, auto-deploy on push |
| Redis | Upstash | Free tier, Singapore region |
| Database | MongoDB Atlas | M0 free cluster |
| Frontend | Vercel | Root: `client/`, Framework: Vite |

### Environment variables needed on Railway
```
MONGO_URI, JWT_SECRET, REDIS_URL, CLOUDINARY_*, CLIENT_URL, PORT
```

### Environment variables needed on Vercel
```
VITE_API_URL, VITE_SOCKET_URL
```

---

## Key Technical Concepts Implemented

- **WebSocket authentication** — JWT verified during Socket.io handshake, not just on REST routes
- **Redis TTL patterns** — online presence with 60s expiry + 30s heartbeat; typing state with 3s auto-clear
- **Cache-first strategy** — Redis checked before MongoDB on every history load
- **Horizontal scaling** — Socket.io Redis adapter syncs events across multiple server instances
- **Stateless auth** — server never stores sessions; JWT signature verified on every request
- **Optimistic UI** — message input clears immediately; server confirmation updates state

---

## What I Learned Building This

- How WebSockets differ from HTTP and when to use each
- JWT authentication for both REST and WebSocket connections
- Redis as a cache, pub/sub broker, and TTL-based state store
- Socket.io rooms for scoped broadcasting
- Horizontal scaling concepts with the Redis adapter
- Cloudinary integration with Multer for file handling
- Production deployment with environment-based configuration

---

## Author
Shambhavi Mishra

---

## License

MIT License — feel free to use this project as a reference or starting point.

---

