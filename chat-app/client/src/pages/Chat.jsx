import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const ROOM_ID = 'general';

export default function Chat() {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // ── EFFECT 1: Join/leave room — only when connection status changes ──
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🚪 Joining room:', ROOM_ID);
    socket.emit('join_room', ROOM_ID);

    return () => {
      socket.emit('leave_room', ROOM_ID);
    };
  }, [socket, isConnected]);

  // ── EFFECT 2: Register listeners — only once when socket exists ──
 
useEffect(() => {
  if (!socket) return;

  // Define handlers as named functions so we can remove the exact same reference
  const onMessage = (message) => {
    console.log('📩 Message arrived:', message);

    // Using functional update guarantees we always have latest state
    setMessages(prev => [...prev, message]);
  };

  const onUserJoined = ({ message }) => {
    setMessages(prev => [
      ...prev,
      { _id: `system-${Date.now()}`, system: true, content: message }
    ]);
  };

  const onTyping = ({ username }) =>
    setTypingUser(`${username} is typing...`);

  const onStopTyping = () => setTypingUser('');

  // ✅ Add error handler here
  const onError = (err) => {
    console.error('🔴 Socket error from server:', err);
  };

  // Register listeners
  socket.on('receive_message', onMessage);
  socket.on('user_joined', onUserJoined);
  socket.on('user_typing', onTyping);
  socket.on('user_stopped_typing', onStopTyping);

  // ✅ Register error listener
  socket.on('error', onError);

  console.log('👂 Listeners registered');

  // Cleanup: remove exact listener references — prevents duplicates
  return () => {
    socket.off('receive_message', onMessage);
    socket.off('user_joined', onUserJoined);
    socket.off('user_typing', onTyping);
    socket.off('user_stopped_typing', onStopTyping);

    // ✅ Cleanup error listener
    socket.off('error', onError);

    console.log('🧹 Listeners cleaned up');
  };
}, [socket]);
   
  // only socket — NOT isConnected, so listeners don't re-register

  // ── EFFECT 3: Auto scroll ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket || !isConnected) return;
    console.log('📤 Emitting send_message');
    socket.emit('send_message', { roomId: ROOM_ID, content: input });
    socket.emit('typing_stop', ROOM_ID);
    setInput('');
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    socket.emit('typing_start', ROOM_ID);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing_stop', ROOM_ID);
    }, 1500);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 700, margin: '0 auto', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ padding: '12px 20px', background: '#1D9E75', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>LinKsy Chat</strong> — #general
          <span style={{ marginLeft: 12, fontSize: 12, opacity: 0.85 }}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14 }}>👤 {user.username}</span>
          <button onClick={logout} style={{ padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#f5f5f5', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: '#aaa', marginTop: 40 }}>
            No messages yet. Say hello! 👋
          </p>
        )}

        {messages.map((msg) => {
          if (msg.system) {
            return (
              <div key={msg._id} style={{ textAlign: 'center', fontSize: 12, color: '#888', padding: '4px 0' }}>
                {msg.content}
              </div>
            );
          }

          const isMe = msg.sender?._id === user.id || msg.sender?.username === user.username;

          return (
            <div key={msg._id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '70%',
                padding: '8px 14px',
                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isMe ? '#1D9E75' : 'white',
                color: isMe ? 'white' : '#333',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}>
                {!isMe && (
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 3, color: '#1D9E75' }}>
                    {msg.sender?.username}
                  </div>
                )}
                <div>{msg.content}</div>
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3, textAlign: 'right' }}>
                  {msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : ''}
                </div>
              </div>
            </div>
          );
        })}

        {typingUser && (
          <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic', paddingLeft: 4 }}>
            {typingUser}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{ padding: '12px 20px', background: 'white', borderTop: '1px solid #eee', display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={handleTyping}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '10px 16px', borderRadius: 24, border: '1px solid #ddd', outline: 'none', fontSize: 14 }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !isConnected}
          style={{
            padding: '10px 20px', borderRadius: 24, border: 'none',
            background: (input.trim() && isConnected) ? '#1D9E75' : '#ccc',
            color: 'white',
            cursor: (input.trim() && isConnected) ? 'pointer' : 'default',
            fontSize: 14
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}