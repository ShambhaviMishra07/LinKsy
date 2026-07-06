

// client/src/pages/Messages.jsx — complete rewrite

import { useEffect, useState } from 'react';

import { useSocket } from '../context/SocketContext';

import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { colors as c } from '../theme';
import BottomNav from '../components/BottomNav';

export default function Messages() {
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();



  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadRooms();
  }, []);





  const loadRooms = async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    setSearch(query);
    if (!query.trim()) { setUsers([]); return; }
    try {
      const { data } = await api.get('/users');
      setUsers(data.filter(u =>
        u.username.toLowerCase().includes(query.toLowerCase())
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const openDM = async (userId) => {
    try {
      const { data } = await api.post(`/rooms/dm/${userId}`);
      navigate(`/chat/${data._id}`, { state: { room: data } });
    } catch (err) {
      console.error(err);
    }
  };

  const openConversation = (room) => {
    navigate(`/chat/${room._id}`, { state: { room } });
  };


  const getDisplayName = (room) => {
    if (!room.isPrivate) return room.name;

    const myId = user.id || user._id;

    const other = room.members?.find(m => {
       const memberId = m._id ? m._id.toString() : m.toString();
    return memberId !== myId;
  });
    return other?.username || 'Direct message';
  };

  return (
    <div style={{ background: c.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: `0.5px solid ${c.border}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 17, fontWeight: 500, color: c.textPrimary }}>Messages</span>
        </div>
        {/* Search bar */}
        <input
          value={search}
          onChange={e => searchUsers(e.target.value)}
          placeholder="Search people..."
          style={{
            width: '100%', padding: '9px 14px', borderRadius: 10,
            border: `1px solid ${c.border}`, background: c.surface,
            color: c.textPrimary, fontSize: 13, boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ flex: 1, maxWidth: 480, width: '100%', margin: '0 auto', overflowY: 'auto' }}>

        {/* Search results */}
        {search.trim() && (
          <div>
            <div style={{ padding: '10px 20px 4px', fontSize: 12, color: c.textMuted }}>
              People
            </div>
            {users.length === 0 && (
              <div style={{ padding: '12px 20px', fontSize: 13, color: c.textMuted }}>
                No users found
              </div>
            )}
            {users.map(u => (
              <div
                key={u._id}
                onClick={() => openDM(u._id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px', cursor: 'pointer',
                  borderBottom: `0.5px solid ${c.border}`
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: c.pinkDark, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 16, color: c.pinkPale,
                  fontWeight: 500, flexShrink: 0, overflow: 'hidden'
                }}>
                  {u.avatar
                    ? <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : u.username.charAt(0).toUpperCase()
                  }
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: c.textPrimary }}>{u.username}</div>
                  <div style={{ fontSize: 12, color: c.textMuted }}>Tap to message</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Existing conversations — only show when not searching */}
        {!search.trim() && (
          <div>
            {loading && (
              <p style={{ textAlign: 'center', color: c.textMuted, fontSize: 13, marginTop: 30 }}>
                Loading...
              </p>
            )}

            {!loading && rooms.length === 0 && (
              <div style={{
                textAlign: 'center', color: c.textMuted, fontSize: 13, padding: '60px 20px'
              }}>
                <div style={{ marginBottom: 8 }}>No conversations yet</div>
                <div style={{ fontSize: 12 }}>Search for someone above to start chatting</div>
              </div>
            )}

            {rooms.map(room => {
              const displayName = getDisplayName(room);
              return (
                <div
                  key={room._id}
                  onClick={() => openConversation(room)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 20px', cursor: 'pointer',
                    borderBottom: `0.5px solid ${c.border}`
                  }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: c.pinkDark, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 17, fontWeight: 500,
                    color: c.pinkPale, flexShrink: 0
                  }}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: c.textPrimary }}>
                      {room.isPrivate ? '' : '# '}{displayName}
                    </div>
                    {room.lastMessage && (
                      <div style={{
                        fontSize: 12, color: c.textMuted, marginTop: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {room.lastMessage.sender}: {room.lastMessage.content}
                      </div>
                    )}
                  </div>
             {room.isMessageRequest && (
                    <span style={{
                      fontSize: 11, color: c.pink, background: c.surface,
                      padding: '3px 8px', borderRadius: 6, flexShrink: 0,
                      border: `1px solid ${c.pinkDark}`
                    }}>
                      Request
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}