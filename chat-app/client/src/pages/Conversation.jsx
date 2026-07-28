// client/src/pages/Conversation.jsx

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { colors as c } from '../theme';

export default function Conversation() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  // Room info passed via navigate's state (from Messages.jsx) — avoids an extra fetch
  const [room, setRoom] = useState(location.state?.room || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // ── Join room + load history when roomId changes ──
useEffect(() => {
  if (!socket || !isConnected || !roomId) return;

  console.log('Joining room:', roomId); // confirm this fires

  socket.emit('join_room', roomId);
  socket.emit('mark_seen', roomId);

  // Mark room as read — clears unread badge
  api.post(`/rooms/${roomId}/read`)
    .catch(console.error);

  const loadHistory = async () => {
    try {
      const { data } = await api.get(`/messages/${roomId}`);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('History error:', err.message);
    }
  };

  loadHistory();

  return () => {
    socket.emit('leave_room', roomId);
  };
}, [socket, isConnected, roomId]);
  // ── Socket listeners ──
 // client/src/pages/Conversation.jsx — update the socket listener useEffect

useEffect(() => {
  if (!socket) return;

  const onMessage = (message) => {
    // Convert both to string for reliable comparison
    const messageRoom = message.room?._id?.toString() || message.room?.toString() || message.room;
    const currentRoom = roomId?.toString();

    if (messageRoom === currentRoom) {
      setMessages(prev => {
        // Prevent duplicate messages
        const exists = prev.some(m => m._id?.toString() === message._id?.toString());
        if (exists) return prev;
        return [...prev, message];
      });
      // Mark as read immediately since we're viewing this room
      api.post(`/rooms/${roomId}/read`).catch(console.error);
    }
  };

  const onMessagesSeen = ({ seenBy }) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    setMessages(prev => prev.map(msg => {
      const senderId = msg.sender?._id?.toString() || msg.sender?.toString();
      if (senderId === (currentUser.id || currentUser._id)?.toString()) {
        const alreadySeen = (msg.seenBy || []).some(id => id.toString() === seenBy.toString());
        if (!alreadySeen) {
          return { ...msg, seenBy: [...(msg.seenBy || []), seenBy] };
        }
      }
      return msg;
    }));
  };

  const onTyping = ({ username }) => setTypingUser(`${username} is typing...`);
  const onStopTyping = () => setTypingUser('');
  const onError = (err) => console.error('Socket error:', err);

  socket.on('receive_message', onMessage);
  socket.on('messages_seen', onMessagesSeen);
  socket.on('user_typing', onTyping);
  socket.on('user_stopped_typing', onStopTyping);
  socket.on('error', onError);

  return () => {
    socket.off('receive_message', onMessage);
    socket.off('messages_seen', onMessagesSeen);
    socket.off('user_typing', onTyping);
    socket.off('user_stopped_typing', onStopTyping);
    socket.off('error', onError);
  };
}, [socket, roomId]); // roomId in deps so it re-registers when switching rooms
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit('send_message', { roomId, content: input, type: 'text' });
    socket.emit('typing_stop', roomId);
    setInput('');
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    socket.emit('typing_start', roomId);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit('typing_stop', roomId), 1500);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      socket.emit('send_message', { roomId, content: data.url, type: 'image' });
    } catch (err) {
      console.error('Upload failed:', err.message);
    } finally {
      e.target.value = '';
    }
  };

  const otherMember = room?.isPrivate ? room.members?.find(m => m._id !== user.id) : null;
  const displayName = room?.isPrivate ? (otherMember?.username || 'Chat') : (room?.name || 'Chat');

  return (
    <div style={{ background: c.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header with back arrow — this is the missing "←" you asked for */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px', borderBottom: `0.5px solid ${c.border}`
      }}>
        <button
          onClick={() => navigate('/chat')}
          aria-label="Back to messages"
          style={{ background: 'none', border: 'none', color: c.textPrimary, fontSize: 20, cursor: 'pointer', padding: 0 }}
        >
          ←
        </button>
        <span style={{ fontSize: 15, fontWeight: 500, color: c.textPrimary }}>
          {room?.isPrivate ? '' : '# '}{displayName}
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: c.textMuted, marginTop: 40, fontSize: 13 }}>
            No messages yet. Say hello!
          </p>
        )}

        {messages.map(msg => {
          const isMe = msg.sender?._id === user.id || msg.sender?.username === user.username;
          const isSeen = msg.seenBy && msg.seenBy.length > 0;

          return (
            <div key={msg._id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '70%', padding: msg.type === 'image' ? '4px' : '8px 14px',
                borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isMe ? c.pink : c.surface,
                color: isMe ? '#fff' : c.textPrimary
              }}>
                {!isMe && (
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 3, color: c.pinkLight, padding: msg.type === 'image' ? '4px 8px 0' : 0 }}>
                    {msg.sender?.username}
                  </div>
                )}
                {msg.type === 'image' ? (
                  <img src={msg.content} alt="shared" style={{ maxWidth: 260, borderRadius: 12, display: 'block' }} />
                ) : (
                  <div>{msg.content}</div>
                )}
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3, textAlign: 'right' }}>
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  {isMe && <span style={{ marginLeft: 4 }}>{isSeen ? '✓✓' : '✓'}</span>}
                </div>
              </div>
            </div>
          );
        })}

        {typingUser && <div style={{ fontSize: 12, color: c.textMuted, fontStyle: 'italic' }}>{typingUser}</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 20px', borderTop: `0.5px solid ${c.border}`, display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ width: 38, height: 38, borderRadius: '50%', border: `1px solid ${c.border}`, background: 'none', color: c.textPrimary, cursor: 'pointer', flexShrink: 0 }}
        >
          +
        </button>
        <input
          value={input}
          onChange={handleTyping}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '10px 16px', borderRadius: 24, border: `1px solid ${c.border}`, background: c.surface, color: c.textPrimary, outline: 'none', fontSize: 14 }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          style={{
            padding: '10px 18px', borderRadius: 24, border: 'none',
            background: input.trim() ? c.pink : c.surfaceLight,
            color: '#fff', cursor: input.trim() ? 'pointer' : 'default', fontSize: 14, flexShrink: 0
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}