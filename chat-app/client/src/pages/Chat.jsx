// client/src/pages/Chat.jsx

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import NotificationBell from '../components/NotificationBell';


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

  // Keep latest activeRoom available inside socket callbacks
  // without forcing the listener effect to re-run on every room switch
  const activeRoomRef = useRef(null);
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // ── Load rooms on mount ───────────────────────────────────────
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const { data } = await api.get('/rooms');
        console.log('📦 Rooms loaded:', data);
        setRooms(data);
        if (data.length > 0) {
          openRoom(data[0]);
        }
      } catch (err) {
        console.error('❌ Failed to load rooms:', err.response?.data || err.message);
      }
    };
    loadRooms();
  }, []);

  // ── Open a room ───────────────────────────────────────────────
  const openRoom = async (room) => {
    if (activeRoomRef.current && socket) {
      socket.emit('leave_room', activeRoomRef.current._id);
    }

    setActiveRoom(room);
    setMessages([]);

    if (socket && isConnected) {
      socket.emit('join_room', room._id.toString());
      socket.emit('mark_seen', room._id.toString());
    }

    try {
      const { data } = await api.get(`/messages/${room._id}`);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('❌ History load failed:', err.response?.data || err.message);
    }
  };

  // ── Re-join room whenever socket (re)connects ───────────────────
  useEffect(() => {
    if (!socket || !isConnected) return;
    if (activeRoomRef.current) {
      socket.emit('join_room', activeRoomRef.current._id.toString());
    }
  }, [socket, isConnected]);

  // ── Register socket listeners ONCE per socket instance ───────────
  useEffect(() => {
    console.log('🔍 Listener effect running. Socket is:', socket?.id || socket);
    if (!socket) return;

    const onMessage = (message) => {
      console.log('📩 onMessage FIRED with:', message);
      setMessages(prev => [...prev, message]);

      const current = activeRoomRef.current;
      if (current && message.room === current._id.toString()) {
        socket.emit('mark_seen', current._id.toString());
      }

      setRooms(prev => prev.map(r =>
        r._id === message.room
          ? { ...r, lastMessage: { content: message.content, sender: message.sender?.username } }
          : r
      ));
    };

    const onMessagesSeen = ({ seenBy }) => {
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
    const onError = (err) => console.error('🔴 Socket error from server:', err);

    socket.on('receive_message', onMessage);
    socket.on('messages_seen', onMessagesSeen);
    socket.on('user_joined', onUserJoined);
    socket.on('user_typing', onTyping);
    socket.on('user_stopped_typing', onStopTyping);
    socket.on('error', onError);

    console.log('👂 Listeners registered');

    return () => {
      console.log('🧹 Cleaning up listeners');
      socket.off('receive_message', onMessage);
      socket.off('messages_seen', onMessagesSeen);
      socket.off('user_joined', onUserJoined);
      socket.off('user_typing', onTyping);
      socket.off('user_stopped_typing', onStopTyping);
      socket.off('error', onError);
    };
  }, [socket]);

  // ── Auto scroll ───────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send text message ─────────────────────────────────────────
  const sendMessage = () => {
    if (!input.trim() || !socket || !activeRoom) return;
    console.log('📤 Emitting send_message:', { roomId: activeRoom._id, content: input });
    socket.emit('send_message', {
      roomId: activeRoom._id.toString(),
      content: input,
      type: 'text'
    });
    socket.emit('typing_stop', activeRoom._id.toString());
    setInput('');
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!socket || !activeRoom) return;
    socket.emit('typing_start', activeRoom._id.toString());
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing_stop', activeRoom._id.toString());
    }, 1500);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeRoom) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      socket.emit('send_message', {
        roomId: activeRoom._id.toString(),
        content: data.url,
        type: 'image'
      });
    } catch (err) {
      console.error('❌ Upload failed:', err.response?.data || err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

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

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>

      {/* SIDEBAR */}
      <div style={{ width: 260, background: '#1a1a2e', color: 'white', display: 'flex', flexDirection: 'column' }}>
     <div style={{ padding: '16px', borderBottom: '1px solid #2a2a4a' }}>
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}
  >
   
  <div style={{ fontWeight: 500, fontSize: 18, color: '#ED93B1', letterSpacing: '0.3px' }}>
  lin<span style={{ color: '#F4C0D1' }}>K</span>sy
</div>

    <NotificationBell />
  </div>

  <div
    style={{
      fontSize: 12,
      color: isConnected ? '#4b96c1' : '#ff6b6b',
      marginTop: 2
    }}
  >
    {isConnected ? ' Online' : 'Offline'}
  </div>
</div>

      <button
      onClick={() => navigate('/discover')}
      style={{
        margin: '8px 16px',
        padding: '8px 0',
        borderRadius: 8,
        border: '1px solid #2a2a4a',
        background: 'transparent',
        color: '#4b96c1',
        fontSize: 13,
        cursor: 'pointer'
      }}
    >
      🔍 Discover People
    </button>

        <div style={{ padding: '12px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#8888aa', textTransform: 'uppercase', letterSpacing: 1 }}>Rooms</span>
          <button
            onClick={() => setShowCreateRoom(!showCreateRoom)}
            style={{ background: 'none', border: 'none', color: '#4b96c1', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
          >+</button>
        </div>

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

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {rooms.map(room => (
            <div
              key={room._id}
              onClick={() => openRoom(room)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                background: activeRoom?._id === room._id ? '#2a2a4a' : 'transparent',
                borderLeft: activeRoom?._id === room._id ? '3px solid #4b96c1' : '3px solid transparent',
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
        
      <div style={{ padding: '12px 16px', borderTop: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span
        onClick={() => navigate(`/profile/${user.id}`)}
        style={{ fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <i className="ti ti-circle-filled" style={{ fontSize: 16, color: '#ED93B1' }} aria-hidden="true"></i>
        {user.username}
      </span>
      <button onClick={logout} style={{ padding: '4px 12px', borderRadius: 4, border: 'none', cursor: 'pointer' }}>
        Logout
      </button>
    </div>
    </div>

      {/* MAIN CHAT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeRoom ? (
          <>
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
                      background: isMe ? '#0f060c' : 'white',
                      color: isMe ? 'white' : '#333',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      {!isMe && (
                        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 3, color: '#4287a9', padding: msg.type === 'image' ? '4px 8px 0' : 0 }}>
                          {msg.sender?.username}
                        </div>
                      )}
                      {msg.type === 'image' ? (
                        <img src={msg.content} alt="shared" style={{ maxWidth: 280, borderRadius: 12, display: 'block' }} />
                      ) : (
                        <div>{msg.content}</div>
                      )}
                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3, textAlign: 'right', padding: msg.type === 'image' ? '0 6px 4px' : 0 }}>
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        {isMe && <span style={{ marginLeft: 4 }}>{isSeen ? '✓✓' : '✓'}</span>}
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

            <div style={{ padding: '12px 20px', background: 'white', borderTop: '1px solid #eee', display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >{uploading ? '⏳' : '📷'}</button>

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
                style={{ padding: '10px 20px', borderRadius: 24, border: 'none', background: input.trim() ? '#ed5dbd' : '#ccc', color: 'white', cursor: input.trim() ? 'pointer' : 'default', fontSize: 14, flexShrink: 0 }}
              >Send</button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 48 }}>💬</div>
            <div style={{ fontSize: 18 }}>Select a room or create one to start chatting</div>
          </div>
        )}
      </div>
    </div>
  );
}