// client/src/pages/Chat.jsx

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';

export default function Chat() {
  const { socket, isConnected } = useSocket();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [uploading, setUploading] = useState(false);
  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // ── Load rooms on mount ───────────────────────────────────────
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const { data } = await api.get('/rooms');
        setRooms(data);

        // Auto-open first room if exists
        if (data.length > 0) {
          openRoom(data[0]);
        }
      } catch (err) {
        console.error('Failed to load rooms:', err.message);
      }
    };
    loadRooms();
  }, []);

  // ── Open a room ───────────────────────────────────────────────
  const openRoom = async (room) => {
    // Leave previous room
    if (activeRoom && socket) {
      socket.emit('leave_room', activeRoom._id);
    }

    setActiveRoom(room);
    setMessages([]);

    // Join new room
    if (socket && isConnected) {
      socket.emit('join_room', room._id.toString());
      socket.emit('mark_seen', room._id.toString());
    }

    // Load message history
    try {
      const { data } = await api.get(`/messages/${room._id}`);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('History load failed:', err.message);
    }
  };

  // ── Socket event listeners ────────────────────────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Re-join active room when socket reconnects
    if (activeRoom) {
      socket.emit('join_room', activeRoom._id.toString());
    }
  }, [socket, isConnected]);

  useEffect(() => {
    if (!socket) return;

    const onMessage = (message) => {
      setMessages(prev => [...prev, message]);

      // Auto-mark as seen if this room is currently open
      if (activeRoom && message.room === activeRoom._id.toString()) {
        socket.emit('mark_seen', activeRoom._id.toString());
      }

      // Update room's last message preview in sidebar
      setRooms(prev => prev.map(r =>
        r._id === message.room
          ? { ...r, lastMessage: { content: message.content, sender: message.sender?.username } }
          : r
      ));
    };

    const onMessagesSeen = ({ seenBy, username }) => {
      // Update seenBy on messages so the tick updates
      setMessages(prev => prev.map(msg =>
        msg.sender?._id === user.id
          ? { ...msg, seenBy: [...(msg.seenBy || []), seenBy] }
          : msg
      ));
    };

    const onUserJoined = ({ message }) => {
      setMessages(prev => [...prev, {
        _id: `system-${Date.now()}`,
        system: true,
        content: message
      }]);
    };

    const onTyping = ({ username }) => setTypingUser(`${username} is typing...`);
    const onStopTyping = () => setTypingUser('');

    socket.on('receive_message', onMessage);
    socket.on('messages_seen', onMessagesSeen);
    socket.on('user_joined', onUserJoined);
    socket.on('user_typing', onTyping);
    socket.on('user_stopped_typing', onStopTyping);

    return () => {
      socket.off('receive_message', onMessage);
      socket.off('messages_seen', onMessagesSeen);
      socket.off('user_joined', onUserJoined);
      socket.off('user_typing', onTyping);
      socket.off('user_stopped_typing', onStopTyping);
    };
  }, [socket, activeRoom]);

  // ── Auto scroll ───────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send text message ─────────────────────────────────────────
  const sendMessage = () => {
    if (!input.trim() || !socket || !activeRoom) return;
    socket.emit('send_message', {
      roomId: activeRoom._id.toString(),
      content: input,
      type: 'text'
    });
    socket.emit('typing_stop', activeRoom._id.toString());
    setInput('');
  };

  // ── Handle typing ─────────────────────────────────────────────
  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!socket || !activeRoom) return;
    socket.emit('typing_start', activeRoom._id.toString());
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing_stop', activeRoom._id.toString());
    }, 1500);
  };

  // ── Upload image ──────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeRoom) return;

    setUploading(true);
    try {
      // Create FormData — required for file uploads
      // This is different from JSON — it's multipart/form-data
      const formData = new FormData();
      formData.append('image', file); // 'image' matches upload.single('image') on server

      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Send the Cloudinary URL as a message with type 'image'
      socket.emit('send_message', {
        roomId: activeRoom._id.toString(),
        content: data.url,   // Cloudinary URL
        type: 'image'
      });

    } catch (err) {
      console.error('Upload failed:', err.message);
    } finally {
      setUploading(false);
      e.target.value = ''; // reset file input
    }
  };

  // ── Create new room ───────────────────────────────────────────
  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const { data } = await api.post('/rooms', { name: newRoomName });
      setRooms(prev => [data, ...prev]);
      setNewRoomName('');
      setShowCreateRoom(false);
      openRoom(data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create room');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width: 260, background: '#1a1a2e', color: 'white', display: 'flex', flexDirection: 'column' }}>

        {/* App name + status */}
        <div style={{ padding: '16px', borderBottom: '1px solid #2a2a4a' }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#5DCAA5' }}>LinKsy</div>
          <div style={{ fontSize: 12, color: isConnected ? '#5DCAA5' : '#ff6b6b', marginTop: 2 }}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>

        {/* Room list header */}
        <div style={{ padding: '12px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#8888aa', textTransform: 'uppercase', letterSpacing: 1 }}>Rooms</span>
          <button
            onClick={() => setShowCreateRoom(!showCreateRoom)}
            style={{ background: 'none', border: 'none', color: '#5DCAA5', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
          >+</button>
        </div>

        {/* Create room input */}
        {showCreateRoom && (
          <div style={{ padding: '0 12px 10px' }}>
            <input
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createRoom()}
              placeholder="Room name..."
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: 'none', fontSize: 13, boxSizing: 'border-box' }}
            />
          </div>
        )}

        {/* Room list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {rooms.map(room => (
            <div
              key={room._id}
              onClick={() => openRoom(room)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                background: activeRoom?._id === room._id ? '#2a2a4a' : 'transparent',
                borderLeft: activeRoom?._id === room._id ? '3px solid #5DCAA5' : '3px solid transparent',
                transition: 'background 0.15s'
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                {room.isPrivate ? '🔒' : '#'} {room.name}
              </div>
              {room.lastMessage && (
                <div style={{ fontSize: 11, color: '#8888aa', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {room.lastMessage.sender}: {room.lastMessage.content}
                </div>
              )}
            </div>
          ))}

          {rooms.length === 0 && (
            <div style={{ padding: 16, fontSize: 13, color: '#8888aa' }}>
              No rooms yet. Create one with +
            </div>
          )}
        </div>

        {/* User info + logout */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13 }}>👤 {user.username}</span>
          <button
            onClick={logout}
            style={{ background: 'none', border: '1px solid #8888aa', color: '#8888aa', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ── MAIN CHAT AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {activeRoom ? (
          <>
            {/* Chat header */}
            <div style={{ padding: '14px 20px', background: 'white', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16 }}>
                  {activeRoom.isPrivate ? '🔒' : '#'} {activeRoom.name}
                </div>
                {activeRoom.description && (
                  <div style={{ fontSize: 12, color: '#888' }}>{activeRoom.description}</div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#f5f5f5', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.length === 0 && (
                <p style={{ textAlign: 'center', color: '#aaa', marginTop: 40 }}>No messages yet. Say hello! 👋</p>
              )}

              {messages.map((msg) => {
                if (msg.system) {
                  return (
                    <div key={msg._id} style={{ textAlign: 'center', fontSize: 12, color: '#888' }}>
                      {msg.content}
                    </div>
                  );
                }

                const isMe = msg.sender?._id === user.id || msg.sender?.username === user.username;
                const isSeen = msg.seenBy && msg.seenBy.length > 0;

                return (
                  <div key={msg._id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: msg.type === 'image' ? '4px' : '8px 14px',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMe ? '#1D9E75' : 'white',
                      color: isMe ? 'white' : '#333',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      {!isMe && (
                        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 3, color: '#1D9E75', padding: msg.type === 'image' ? '4px 8px 0' : 0 }}>
                          {msg.sender?.username}
                        </div>
                      )}

                      {/* Render image or text based on type */}
                      {msg.type === 'image' ? (
                        <img
                          src={msg.content}
                          alt="shared"
                          style={{ maxWidth: 280, borderRadius: 12, display: 'block' }}
                        />
                      ) : (
                        <div>{msg.content}</div>
                      )}

                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3, textAlign: 'right', padding: msg.type === 'image' ? '0 6px 4px' : 0 }}>
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                        {/* Read receipt tick — only show on sender's messages */}
                        {isMe && (
                          <span style={{ marginLeft: 4 }}>
                            {isSeen ? '✓✓' : '✓'}
                            {/* ✓ = sent, ✓✓ = seen by at least one person */}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {typingUser && (
                <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>{typingUser}</div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: '12px 20px', background: 'white', borderTop: '1px solid #eee', display: 'flex', gap: 10, alignItems: 'center' }}>

              {/* Hidden file input */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              {/* Image upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  width: 40, height: 40, borderRadius: '50%', border: '1px solid #ddd',
                  background: 'white', cursor: 'pointer', fontSize: 18, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}
              >
                {uploading ? '⏳' : '📷'}
              </button>

              <input
                value={input}
                onChange={handleTyping}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                style={{ flex: 1, padding: '10px 16px', borderRadius: 24, border: '1px solid #ddd', outline: 'none', fontSize: 14 }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                style={{
                  padding: '10px 20px', borderRadius: 24, border: 'none',
                  background: input.trim() ? '#1D9E75' : '#ccc',
                  color: 'white', cursor: input.trim() ? 'pointer' : 'default', fontSize: 14, flexShrink: 0
                }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          // No room selected yet
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 48 }}>💬</div>
            <div style={{ fontSize: 18 }}>Select a room or create one to start chatting</div>
          </div>
        )}
      </div>
    </div>
  );
}
