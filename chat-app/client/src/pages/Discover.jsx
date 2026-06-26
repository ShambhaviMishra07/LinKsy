// client/src/pages/Discover.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { colors as c } from '../theme';

export default function Discover() {
  const [users, setUsers] = useState([]);
  const [statusMap, setStatusMap] = useState({}); // { userId: { iFollow, pendingRequest, ... } }
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);

      // Fetch follow status for each user so buttons show correct state
      const statuses = {};
      for (const user of data) {
        const { data: statusData } = await api.get(`/follow/status/${user._id}`);
        statuses[user._id] = statusData;
      }
      setStatusMap(statuses);
    } catch (err) {
      console.error('Failed to load users:', err.message);
    }
  };

  const handleFollowToggle = async (userId) => {
  const current = statusMap[userId];

  try {
    if (current?.iFollow) {
      // UNFOLLOW
      await api.delete(`/follow/${userId}`);

      setStatusMap(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          iFollow: false
        }
      }));

    } else if (current?.pendingRequest) {
      // CANCEL PENDING REQUEST
      await api.delete(`/follow/requests/${userId}/cancel`);

      setStatusMap(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          pendingRequest: false
        }
      }));

    } else {
      // FOLLOW
      const { data } = await api.post(`/follow/${userId}`);

      setStatusMap(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          iFollow: data.status === 'accepted',
          pendingRequest: data.status === 'pending'
        }
      }));
    }

  } catch (err) {
    alert(err.response?.data?.message || 'Action failed');
  }
};

  const getButtonLabel = (userId) => {
    const s = statusMap[userId];
    if (!s) return '...';
    if (s.iFollow) return 'Following';
    if (s.pendingRequest) return 'Requested';
    return 'Follow';
  };

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.textPrimary, fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Discover people</h2>
          <button
            onClick={() => navigate('/chat')}
            style={{ background: 'none', border: 'none', color: c.textMuted, fontSize: 13, cursor: 'pointer' }}
          >
            ← Back to chat
          </button>
        </div>

        {/* User list */}
        {users.length === 0 && (
          <p style={{ color: c.textMuted, fontSize: 14 }}>No other users yet. Register a second account to test!</p>
        )}

        {users.map(user => (
          <div
            key={user._id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 0', borderBottom: `1px solid ${c.border}`
            }}
          >
            {/* Avatar */}
            <div
              onClick={() => navigate(`/profile/${user._id}`)}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: c.pinkDark, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16, fontWeight: 500,
                color: c.pinkPale, cursor: 'pointer', flexShrink: 0
              }}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>

            {/* Username + bio */}
            <div
              onClick={() => navigate(`/profile/${user._id}`)}
              style={{ flex: 1, cursor: 'pointer' }}
            >
              <div style={{ fontWeight: 500, fontSize: 14 }}>
                {user.username} {user.isPrivate && <span style={{ fontSize: 11, color: c.textMuted }}>🔒</span>}
              </div>
              {user.bio && (
                <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>{user.bio}</div>
              )}
            </div>

        <button
        onClick={() => handleFollowToggle(user._id)}
        style={{
          padding: '7px 16px',
          borderRadius: 8,
          border:
            statusMap[user._id]?.iFollow || statusMap[user._id]?.pendingRequest
              ? `1px solid ${c.border}`
              : 'none',
          background:
            statusMap[user._id]?.iFollow || statusMap[user._id]?.pendingRequest
              ? 'transparent'
              : c.pink,
          color:
            statusMap[user._id]?.iFollow || statusMap[user._id]?.pendingRequest
              ? c.textPrimary
              : '#fff',
          fontWeight: 500,
          fontSize: 13,
          cursor: 'pointer',
          flexShrink: 0
        }}
      >
        {getButtonLabel(user._id)}
      </button>
          </div>
        ))}
      </div>
    </div>
  );
}