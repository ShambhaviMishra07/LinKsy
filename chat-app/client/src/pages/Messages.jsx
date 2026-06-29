// client/src/pages/Messages.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { colors as c } from '../theme';
import BottomNav from '../components/BottomNav';

export default function Messages() {
  const [rooms, setRooms] = useState([]);
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
      console.error('Failed to load rooms:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // This is the key behavior change — clicking a room NAVIGATES
  // to a separate URL instead of just changing state in the same page.
  // The chat only mounts once we're actually on /chat/:roomId
  const openConversation = (room) => {
    navigate(`/chat/${room._id}`, { state: { room } });
  };

  return (
    <div style={{ background: c.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', borderBottom: `0.5px solid ${c.border}`
      }}>
        <button
          onClick={() => navigate('/home')}
          style={{ background: 'none', border: 'none', color: c.textMuted, fontSize: 14, cursor: 'pointer' }}
        >
          ← Home
        </button>
        <span style={{ fontSize: 16, fontWeight: 500, color: c.textPrimary }}>Messages</span>
        <div style={{ width: 50 }} /> {/* spacer to balance the back button */}
      </div>

      <div style={{ flex: 1, maxWidth: 480, width: '100%', margin: '0 auto' }}>

        {loading && (
          <p style={{ textAlign: 'center', color: c.textMuted, fontSize: 13, marginTop: 30 }}>
            Loading conversations...
          </p>
        )}

        {!loading && rooms.length === 0 && (
          <div style={{
            textAlign: 'center', color: c.textMuted, fontSize: 13,
            padding: '60px 20px'
          }}>
            No conversations yet. Visit Discover to find people to chat with.
          </div>
        )}

        {rooms.map(room => {
          // Figure out the display name — for DMs show the OTHER person's name
          const otherMember = room.isPrivate
            ? room.members?.find(m => m._id !== user.id)
            : null;
          const displayName = room.isPrivate
            ? (otherMember?.username || 'Direct message')
            : room.name;

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
                  padding: '3px 8px', borderRadius: 6, flexShrink: 0
                }}>
                  Request
                </span>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}