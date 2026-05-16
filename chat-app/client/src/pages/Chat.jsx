import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';

const ROOM_ID = 'general';

export default function Chat() {
  const { socket, isConnected } = useSocket();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUser, setTypingUser] = useState('');

  // ✅ Online users state
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // ── EFFECT 1: Join/Leave Room ─────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🚪 Joining room:', ROOM_ID);

    socket.emit('join_room', ROOM_ID);

    return () => {
      socket.emit('leave_room', ROOM_ID);
    };
  }, [socket, isConnected]);

  // ── EFFECT 2: Register Socket Listeners ──────────────────
  useEffect(() => {
    if (!socket) return;

    // Message received
    const onMessage = (message) => {
      console.log('📩 Message arrived:', message);

      setMessages(prev => [...prev, message]);
    };

    // User joined
    const onUserJoined = ({ message }) => {
      setMessages(prev => [
        ...prev,
        {
          _id: `system-${Date.now()}`,
          system: true,
          content: message
        }
      ]);
    };

    // Typing
    const onTyping = ({ username }) => {
      setTypingUser(`${username} is typing...`);
    };

    const onStopTyping = () => {
      setTypingUser('');
    };

    // Error handler
    const onError = (err) => {
      console.error('🔴 Socket error from server:', err);
    };

    // User online
    const onUserOnline = ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    };

    // User offline
    const onUserOffline = ({ userId }) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    };

    // Register listeners
    socket.on('receive_message', onMessage);
    socket.on('user_joined', onUserJoined);
    socket.on('user_typing', onTyping);
    socket.on('user_stopped_typing', onStopTyping);
    socket.on('error', onError);

    // ✅ Online/offline listeners
    socket.on('user_online', onUserOnline);
    socket.on('user_offline', onUserOffline);

    console.log('👂 Listeners registered');

    // Cleanup listeners
    return () => {
      socket.off('receive_message', onMessage);
      socket.off('user_joined', onUserJoined);
      socket.off('user_typing', onTyping);
      socket.off('user_stopped_typing', onStopTyping);
      socket.off('error', onError);

      // ✅ Cleanup online/offline
      socket.off('user_online', onUserOnline);
      socket.off('user_offline', onUserOffline);

      console.log('🧹 Listeners cleaned up');
    };
  }, [socket]);

  // ── EFFECT 3: Auto Scroll ────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  // ── EFFECT 4: Load Message History ───────────────────────
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data } = await api.get(`/messages/${ROOM_ID}`);

        console.log(`📚 History loaded from: ${data.source}`);

        setMessages(data.messages || []);
      } catch (err) {
        console.log('No history yet');
      }
    };

    loadHistory();
  }, []);

  // ── Send Message ─────────────────────────────────────────
  const sendMessage = () => {
    if (!input.trim() || !socket || !isConnected) return;

    console.log('📤 Emitting send_message');

    socket.emit('send_message', {
      roomId: ROOM_ID,
      content: input
    });

    socket.emit('typing_stop', ROOM_ID);

    setInput('');
  };

  // ── Typing Handler ───────────────────────────────────────
  const handleTyping = (e) => {
    setInput(e.target.value);

    if (!socket) return;

    socket.emit('typing_start', ROOM_ID);

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit('typing_stop', ROOM_ID);
    }, 1500);
  };

  // ── Logout ───────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    navigate('/login');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxWidth: 700,
        margin: '0 auto',
        fontFamily: 'sans-serif'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 20px',
          background: '#1D9E75',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <strong>LinKsy Chat</strong> — #general

          <span
            style={{
              marginLeft: 12,
              fontSize: 12,
              opacity: 0.85
            }}
          >
            {isConnected
              ? '🟢 Connected'
              : '🔴 Disconnected'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <span style={{ fontSize: 14 }}>
            👤 {user.username}
          </span>

          <button
            onClick={logout}
            style={{
              padding: '4px 12px',
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          background: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}
      >
        {messages.length === 0 && (
          <p
            style={{
              textAlign: 'center',
              color: '#aaa',
              marginTop: 40
            }}
          >
            No messages yet. Say hello! 👋
          </p>
        )}

        {messages.map((msg) => {
          if (msg.system) {
            return (
              <div
                key={msg._id}
                style={{
                  textAlign: 'center',
                  fontSize: 12,
                  color: '#888',
                  padding: '4px 0'
                }}
              >
                {msg.content}
              </div>
            );
          }

          const isMe =
            msg.sender?._id === user.id ||
            msg.sender?.username === user.username;

          return (
            <div
              key={msg._id}
              style={{
                display: 'flex',
                justifyContent: isMe
                  ? 'flex-end'
                  : 'flex-start'
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '8px 14px',
                  borderRadius: isMe
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px',
                  background: isMe
                    ? '#1D9E75'
                    : 'white',
                  color: isMe ? 'white' : '#333',
                  boxShadow:
                    '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {!isMe && (
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      marginBottom: 3,
                      color: '#1D9E75'
                    }}
                  >
                    {msg.sender?.username}
                  </div>
                )}

                <div>{msg.content}</div>

                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.7,
                    marginTop: 3,
                    textAlign: 'right'
                  }}
                >
                  {msg.createdAt
                    ? new Date(
                        msg.createdAt
                      ).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : ''}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing */}
        {typingUser && (
          <div
            style={{
              fontSize: 12,
              color: '#888',
              fontStyle: 'italic',
              paddingLeft: 4
            }}
          >
            {typingUser}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '12px 20px',
          background: 'white',
          borderTop: '1px solid #eee',
          display: 'flex',
          gap: 10
        }}
      >
        <input
          value={input}
          onChange={handleTyping}
          onKeyDown={(e) =>
            e.key === 'Enter' && sendMessage()
          }
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 24,
            border: '1px solid #ddd',
            outline: 'none',
            fontSize: 14
          }}
        />

        <button
          onClick={sendMessage}
          disabled={!input.trim() || !isConnected}
          style={{
            padding: '10px 20px',
            borderRadius: 24,
            border: 'none',
            background:
              input.trim() && isConnected
                ? '#1D9E75'
                : '#ccc',
            color: 'white',
            cursor:
              input.trim() && isConnected
                ? 'pointer'
                : 'default',
            fontSize: 14
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

