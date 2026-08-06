# LinKsy 

> **A full-stack social platform with real-time communication and an integrated women's safety SOS system.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=flat&logo=socket.io)](https://socket.io)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Redis](https://img.shields.io/badge/Redis-Upstash-DC382D?style=flat&logo=redis&logoColor=white)](https://upstash.com)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?style=flat&logo=vercel)](https://vercel.com)
[![Deployed on Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://render.com)

---



---

## What is LinKsy?

LinKsy is a production-grade social media platform inspired by Instagram, built entirely from scratch using the MERN stack. It combines everything you'd expect from a modern social app — posts, stories, follows, real-time chat — with something no other social platform offers: a **built-in four-phase women's safety SOS system** accessible at any moment from the top of the screen.

**Live Demo:** [linksy.vercel.app](https://linksy.vercel.app)  
**Backend Health Check:** [linksy-server.onrender.com/health](https://linksy-server.onrender.com/health)

> ⚠️ The backend is hosted on Render's free tier which spins down after 15 minutes of inactivity. The first request after inactivity may take 30–60 seconds to wake up. This is expected behaviour on the free tier.

---

##  Features

###  Authentication and Security
- Email verification on registration — accounts cannot log in until the email link is clicked
- **Two-Factor Authentication (2FA)** — a 6-digit OTP is emailed on every login attempt
- JWT-based stateless authentication for all REST routes and WebSocket connections
- bcrypt password hashing with 10 salt rounds
- Private account mode — requires follow approval before content or messages are visible
- WebSocket connections authenticated via JWT in the Socket.io handshake

###  Social Graph
- Follow request system with pending / accepted / rejected states
- Public accounts auto-accept follows; private accounts require manual approval from a requests inbox
- Mutual follow detection — messaging is gated by relationship status
- Message request inbox — messages from non-mutual followers are held separately until approved
- Discover page to find and follow other users
- Followers and following list pages with real-time counts

###  Real-Time Messaging
- Instant message delivery via Socket.io WebSockets (under 50ms average)
- Typing indicators with Redis TTL auto-expiry (3 seconds) — clears automatically if browser crashes
- Read receipts (✓ sent → ✓✓ seen by recipient)
- Image sharing inside chat via Cloudinary
- Real-time unread message badge on the Messages nav icon
- Message history served from Redis cache for instant load on room open
- Search users directly from the Messages inbox

###  Posts and Feed
- Upload photos and videos with captions up to 2200 characters
- Home feed shows posts only from people you follow, newest first
- Like posts using the flower icon (custom doodle icon system)
- Comments via a slide-up sheet (Instagram-style bottom panel)
- Delete your own posts directly from the profile grid
- Post grid on profile page (3 columns)

###  Moments (Stories)
- 24-hour expiring stories using MongoDB TTL index — no deletion code needed, database handles it automatically
- Full-screen viewer with animated progress bar and tap-to-advance
- Seen/unseen ring indicator — pink gradient ring means you haven't viewed it yet
- Stories row on home page shows your ring and all people you follow who have active moments
- Tap your own ring to view your active moment, or add a new one

###  Real-Time Notifications
- Notification bell updates instantly without any page refresh
- Powered by Socket.io personal rooms (`user:{id}`) — server pushes directly to the right device
- Notification types: follow, follow request, follow accepted, SOS alert, location share started
- Unread count badge on the bell icon
- Clicking a notification routes to the relevant page (requests inbox, profile, tracking page)

###  SOS Safety System

| Phase | Feature | How It Works |
|---|---|---|
| 1 — Alarm | Loud siren on device | Web Audio API oscillator, sawtooth wave, 600Hz–1400Hz continuous sweep |
| 2 — Location | Live GPS to trusted contacts | `Geolocation.watchPosition` streams coordinates over Socket.io |
| 3 — Camera | Real-time video recording | `MediaRecorder` captures 5-second chunks sent as ArrayBuffers over socket |
| 4 — Map | Nearby safety places | Overpass API queries OpenStreetMap for hospitals and police within 1.5km |

Additional SOS features:
- Trusted contacts management — choose exactly who gets alerted
- Receiver-side 5-second double-beep plays on the contact's device on **any page** (global App-level listener)
- Real-time notification the moment SOS or location share is triggered — no refresh needed
- One-tap Google Maps walking directions to the nearest hospital or police station
- "I'm safe" button stops the alarm, clears the GPS watcher, and resolves the alert in the database
- Share location can be used silently without the alarm — for quietly letting someone know where you are

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI component library |
| React Router v6 | Client-side routing and protected route guards |
| Vite | Build tool and development server |
| @tabler/icons-react | Icon system (flower, cloud, spiral, sparkles, feather) |
| Socket.io-client | WebSocket client with auto-reconnection |
| Axios | HTTP client with JWT interceptor on every request |
| React-Leaflet + Leaflet | Safety map rendering (open source, no API key needed) |
| Web Audio API | Alarm siren and receiver beep (no audio files needed) |
| MediaDevices API | Camera and microphone access for SOS recording |
| Geolocation API | GPS coordinate streaming for live location |
| MediaRecorder API | In-browser video recording |

### Backend
| Technology | Purpose |
|---|---|
| Node.js 18+ | JavaScript runtime environment |
| Express.js | REST API routing and middleware |
| Socket.io | WebSocket server with room-based broadcasting |
| Mongoose | MongoDB object modelling and schema validation |
| JWT (jsonwebtoken) | Stateless token-based authentication |
| bcryptjs | Password hashing with configurable salt rounds |
| Nodemailer | Email sending for verification and OTP via Gmail SMTP |
| Multer (memory storage) | File upload middleware — stores in RAM buffer |
| Cloudinary SDK | Cloud image and video storage with transformation |
| ioredis | Redis client for caching, pub/sub, and ephemeral state |
| crypto (Node built-in) | OTP generation and verification token creation |

### Infrastructure and Services
| Service | Purpose |
|---|---|
| MongoDB Atlas (M0 free) | Cloud hosted NoSQL database |
| Upstash (free tier) | Serverless Redis with TLS, accessible from anywhere |
| Cloudinary (free tier) | Image and video CDN with 25GB storage |
| Vercel (free tier) | Frontend hosting with global edge network |
| Render (free tier) | Backend hosting with WebSocket support |
| Gmail SMTP | Email delivery — free, reliable, no third-party service |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   CLIENT  (React + Vite → Vercel)               │
│  SocketContext wraps the entire app with one persistent socket   │
│  Global SOS listeners in App.jsx fire beep on any page          │
└──────────────────┬──────────────────────────┬───────────────────┘
                   │  REST API (Axios + JWT)   │  WebSocket (Socket.io)
                   ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              SERVER  (Express + Socket.io → Render)              │
│  auth.middleware.js verifies JWT on every REST request           │
│  Socket.io middleware verifies JWT on every WS connection        │
│  Each user joins personal room  user:{userId}  on connect        │
│  Chat rooms identified by MongoDB Room _id                       │
└──────────────┬────────────────────────────┬─────────────────────┘
               │                            │
               ▼                            ▼
  ┌────────────────────────┐    ┌──────────────────────────────┐
  │    MongoDB Atlas       │    │    Redis  (Upstash)          │
  │    11 collections      │    │                              │
  │    • users             │    │  room:messages:{id}          │
  │    • posts             │    │  → LPUSH + LTRIM 50 + EX 24h │
  │    • comments          │    │                              │
  │    • rooms             │    │  user:online:{id}            │
  │    • messages          │    │  → SET 1 EX 60 + heartbeat   │
  │    • follows           │    │                              │
  │    • followrequests    │    │  typing:{room}:{id}          │
  │    • moments (TTL)     │    │  → SET username EX 3         │
  │    • notifications     │    │                              │
  │    • sosalerts         │    │  otp:{userId}                │
  │    • trustedcontacts   │    │  → SET code EX 600           │
  └────────────────────────┘    └──────────────────────────────┘
               │
               ▼
  ┌────────────────────────┐
  │    Cloudinary CDN      │
  │    linksy/avatars/     │
  │    linksy/posts/       │
  │    linksy/moments/     │
  │    linksy/chat/        │
  └────────────────────────┘
```

---

## Project Structure

```
chat-app/
│
├── server/
│   ├── config/
│   │   ├── db.js                    # MongoDB Atlas connection with error logging
│   │   ├── redis.js                 # Upstash Redis with safe wrapper methods
│   │   ├── cloudinary.js            # Cloudinary config + Multer memory storage
│   │   └── emailTemplates.js        # Branded HTML email templates (verify + OTP)
│   │
│   ├── models/
│   │   ├── User.js                  # isVerified, verificationToken, 2FA fields
│   │   ├── Post.js                  # mediaUrl, likes[], commentsCount
│   │   ├── Comment.js               # content, post ref, author ref
│   │   ├── Room.js                  # isPrivate, isMessageRequest, unreadCounts Map
│   │   ├── Message.js               # content, type, seenBy[]
│   │   ├── Follow.js                # follower + following (unique index)
│   │   ├── FollowRequest.js         # from + to + status (pending/accepted/rejected)
│   │   ├── Moment.js                # expiresAt with TTL index
│   │   ├── Notification.js          # type enum covers all notification scenarios
│   │   ├── SOSAlert.js              # alertType, status, lastLocation, notifiedContacts
│   │   └── TrustedContact.js        # user + contact + label
│   │
│   ├── routes/
│   │   ├── auth.routes.js           # register, verify-email, login, verify-otp
│   │   ├── user.routes.js           # profile, avatar upload, update
│   │   ├── post.routes.js           # CRUD, feed query, like toggle
│   │   ├── comment.routes.js        # create, delete, fetch by post
│   │   ├── room.routes.js           # rooms, DMs, unread-count, mark-read
│   │   ├── message.routes.js        # history (cache-first), mark seen
│   │   ├── follow.routes.js         # follow, unfollow, requests, status check
│   │   ├── moment.routes.js         # feed (grouped by author), mine, view
│   │   ├── notification.routes.js   # list, unread-count, mark-read
│   │   ├── upload.routes.js         # general Cloudinary upload for chat images
│   │   └── sos.routes.js            # trigger, share-location, resolve, contacts
│   │
│   ├── middleware/
│   │   └── auth.middleware.js       # JWT verify → sets req.user
│   │
│   ├── socket/
│   │   ├── socket.js                # init, Redis adapter, personal rooms, presence
│   │   └── events/
│   │       ├── message.events.js    # send_message, mark_seen, typing, unread counts
│   │       ├── room.events.js       # join_room, leave_room
│   │       └── sos.events.js        # SOS rooms, location relay, video chunk relay
│   │
│   ├── utils/
│   │   └── notifyUser.js            # Creates notification + emits via socket instantly
│   │
│   ├── server.js                    # Express app, CORS, routes, health check, io setup
│   └── package.json                 # engines: node >=18, start: node server.js
│
└── client/
    └── src/
        ├── api/
        │   └── axios.js             # baseURL from VITE_API_URL, JWT interceptor
        ├── context/
        │   └── SocketContext.jsx    # Single socket for entire app, connectSocket()
        ├── hooks/
        │   └── useUnreadMessages.js # Polls on mount + listens to socket for badge
        ├── theme.js                 # Pink/black color tokens
        ├── components/
        │   ├── BottomNav.jsx        # Spiral, sparkles, feather, circle tabs + badge
        │   ├── NotificationBell.jsx # Real-time bell with dropdown
        │   ├── PostCard.jsx         # Media, flower like, cloud comment, captions
        │   ├── CommentsSheet.jsx    # Slide-up bottom sheet
        │   ├── SOSButton.jsx        # Alarm only — Web Audio sawtooth oscillator
        │   ├── SOSCamera.jsx        # Camera preview, recording, chunk sending
        │   ├── SOSPill.jsx          # Red pill in header linking to /sos
        │   └── ShareLocationButton.jsx # GPS watcher + socket streaming
        └── pages/
            ├── Home.jsx             # Feed + Moments stories row + SOSPill + bell
            ├── Login.jsx            # Glassmorphism card, password toggle
            ├── Register.jsx         # Full validation, password strength bar
            ├── OTPVerify.jsx        # 6 separate digit inputs, auto-advance, paste support
            ├── VerifyEmail.jsx      # Token verification landing page
            ├── Messages.jsx         # Inbox with search bar and unread badges
            ├── Conversation.jsx     # Real-time chat with history, typing, receipts
            ├── Profile.jsx          # Stats, edit button, Memories, posts grid
            ├── EditProfile.jsx      # Avatar upload, bio, username, privacy, logout
            ├── Discover.jsx         # User list with follow/unfollow toggle
            ├── Requests.jsx         # Pending follow requests with accept/reject
            ├── CreatePost.jsx       # File select, preview, caption, share
            ├── CreateMoment.jsx     # Photo/video + caption + 24h expiry info
            ├── MomentViewer.jsx     # Full screen, progress bars, tap advance
            ├── FollowersList.jsx    # Clickable list linking to profiles
            ├── FollowingList.jsx    # Clickable list linking to profiles
            ├── SOS.jsx              # Hub: alarm button, 2x2 action cards
            ├── SOSContacts.jsx      # Add/remove trusted contacts
            ├── SOSTrack.jsx         # Receiver page: coordinates + map link + video
            └── SafetyMap.jsx        # Leaflet map + Overpass API + directions
```

##  API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Create account + send verification email |
| GET | `/api/auth/verify-email?token=` | None | Verify email from link |
| POST | `/api/auth/resend-verification` | None | Resend verification email |
| POST | `/api/auth/login` | None | Validate credentials + send OTP |
| POST | `/api/auth/verify-otp` | None | Verify OTP → receive JWT |
| POST | `/api/auth/resend-otp` | None | Send new OTP code |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | JWT | List all users except self |
| GET | `/api/users/:id` | JWT | Get user by ID |
| GET | `/api/users/:id/profile` | JWT | Full profile with follower and post counts |
| PUT | `/api/users/me` | JWT | Update bio, username, privacy |
| POST | `/api/users/me/avatar` | JWT | Upload profile picture (multipart) |

### Posts

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/posts` | JWT | Create post (multipart/form-data) |
| GET | `/api/posts/feed` | JWT | Posts from followed users, newest first |
| GET | `/api/posts/user/:userId` | JWT | All posts by a user |
| POST | `/api/posts/:id/like` | JWT | Toggle like on/off |
| DELETE | `/api/posts/:id` | JWT | Delete own post |

### Comments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/comments/:postId` | JWT | All comments on a post |
| POST | `/api/comments/:postId` | JWT | Add a comment |
| DELETE | `/api/comments/:commentId` | JWT | Delete own comment |

### Follow

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/follow/:userId` | JWT | Follow or send follow request |
| DELETE | `/api/follow/:userId` | JWT | Unfollow |
| DELETE | `/api/follow/requests/:userId/cancel` | JWT | Cancel pending request |
| GET | `/api/follow/requests` | JWT | Incoming follow requests |
| POST | `/api/follow/requests/:id/accept` | JWT | Accept a follow request |
| POST | `/api/follow/requests/:id/reject` | JWT | Reject a follow request |
| GET | `/api/follow/status/:userId` | JWT | Relationship status (iFollow, followsMe, isMutual) |
| GET | `/api/follow/:userId/followers` | JWT | Followers list |
| GET | `/api/follow/:userId/following` | JWT | Following list |

### SOS

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/sos/trigger` | JWT | Trigger alarm + notify trusted contacts |
| POST | `/api/sos/share-location` | JWT | Start silent location sharing |
| POST | `/api/sos/resolve/:alertId` | JWT | Mark safe + stop all streams |
| GET | `/api/sos/contacts` | JWT | Get trusted contacts list |
| POST | `/api/sos/contacts/:userId` | JWT | Add a trusted contact |
| DELETE | `/api/sos/contacts/:id` | JWT | Remove a trusted contact |
| GET | `/api/sos/active/:alertId` | JWT | Alert details for tracking page |

### Socket Events

```
Client → Server:
  send_message           { roomId, content, type }
  join_room              roomId
  leave_room             roomId
  mark_seen              roomId
  typing_start           roomId
  typing_stop            roomId
  join_sos_alert         alertId
  join_sos_tracking      alertId
  sos_location_update    { alertId, lat, lng }
  sos_video_chunk        { alertId, chunk, timestamp }

Server → Client:
  receive_message            messageObj
  user_typing                { userId, username }
  user_stopped_typing        { userId }
  messages_seen              { roomId, seenBy }
  new_notification           notificationObj
  unread_messages_count      { count }
  sos_alert_triggered        { alertId, from }
  sos_location_share_started { alertId, from }
  sos_location_update        { lat, lng, timestamp }
  sos_video_chunk            { chunk, timestamp }
  user_online                { userId }
  user_offline               { userId }
```

---

## 🔑 Key Technical Decisions Explained

**Why separate `Follow` and `FollowRequest` collections?**
Checking "does A follow B?" is done on every profile load, every DM open, and every message send. It must be O(1). A combined collection with a `status` field would require filtering on every lookup. The separate design keeps `Follow` clean — a single indexed query returns the answer instantly.

**Why Redis TTL for typing indicators?**
Typing state naturally expires after a few seconds. Storing it in Redis with `EX 3` means if the user's browser crashes mid-typing, the "X is typing..." indicator disappears in 3 seconds automatically. No cleanup code is needed anywhere.

**Why Multer memory storage instead of multer-storage-cloudinary?**
The `multer-storage-cloudinary` adapter has version conflicts with newer Cloudinary SDK versions causing silent 500 errors. Using `memoryStorage()` and calling `cloudinary.uploader.upload_stream()` manually in a Promise wrapper is reliable, well-documented, and gives full control over upload options.

**Why Web Audio API for the SOS alarm?**
An audio file requires a network request before playing — unacceptable for an emergency feature. The Web Audio API generates the oscillator sound in the browser with zero latency and zero network dependency. The sawtooth waveform and 600Hz–1400Hz sweep produces a siren-like sound similar to emergency alarms.

**Why are SOS socket listeners in App.jsx instead of SOSTrack.jsx?**
The receiver-side beep must fire regardless of which page the contact is on. `SOSTrack.jsx` only mounts when the contact navigates to the tracking page — if they are on the Home page, the component is unmounted and the event would be missed. Placing the listener in `AppRoutes` inside `App.jsx` ensures it is always active.

---

## 📋 Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas SRV or replica set connection string |
| `JWT_SECRET` | ✅ | Secret for signing JWTs — minimum 32 characters |
| `REDIS_URL` | ✅ | Upstash ioredis URL — must start with `rediss://` |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `EMAIL_USER` | ✅ | Gmail address used to send emails |
| `EMAIL_PASS` | ✅ | Gmail App Password — 16 characters, no spaces |
| `EMAIL_FROM` | ✅ | Display name shown in sent emails |
| `CLIENT_URL` | ✅ | Your Vercel frontend URL (for CORS) |
| `PORT` | Optional | Defaults to 5000 — Render sets this automatically |
| `NODE_ENV` | Optional | `development` or `production` |

### Client (Vercel environment variables or `client/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API base URL including `/api` |
| `VITE_SOCKET_URL` | ✅ | Backend base URL for Socket.io connection |

---

## 🔗 Useful Links

- [Socket.io Documentation](https://socket.io/docs/v4)
- [MongoDB Atlas Setup Guide](https://www.mongodb.com/docs/atlas/getting-started)
- [Upstash Redis](https://upstash.com/docs/redis/quickstarts/ioredis)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Nodemailer Gmail Setup](https://nodemailer.com/usage/using-gmail)
- [Render Deployment Guide](https://render.com/docs/deploy-node-express-app)
- [Vercel Vite Deployment](https://vercel.com/docs/frameworks/vite)
- [Leaflet.js Documentation](https://leafletjs.com/reference)
- [Overpass API](https://overpass-api.de)
- [Web Audio API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

---

## 👩‍💻 Author

**Shambhavi Mishra**

- Github: https://github.com/ShambhaviMishra07
- LinkedIn: https://www.linkedin.com/in/shambhavimis02shra

---


## 🙏 Acknowledgements

- [Socket.io](https://socket.io) — for making real-time WebSocket development approachable
- [Tabler Icons](https://tabler.io/icons) — for the beautiful, consistent outline icon set
- [OpenStreetMap + Overpass API](https://overpass-api.de) — for completely free geospatial data requiring no API key
- [Upstash](https://upstash.com) — for serverless Redis that works seamlessly on free tier
- [Cloudinary](https://cloudinary.com) — for generous free-tier cloud media storage
- [Vercel](https://vercel.com) and [Render](https://render.com) — for free hosting that makes production deployment accessible to students

---

*Built with 💗 as a portfolio project demonstrating full-stack engineering, real-time systems, cloud integration, and safety-first product design.*
