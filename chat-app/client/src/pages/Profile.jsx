// client/src/pages/Profile.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { colors as c } from '../theme';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data: statusData } = await api.get(`/follow/status/${userId}`);
      setStatus(statusData);
      // You'd also fetch user details here via a /users/:id route
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollow = async () => {
    try {
      const { data } = await api.post(`/follow/${userId}`);
      if (data.status === 'accepted') {
        setStatus(prev => ({ ...prev, iFollow: true }));
      } else {
        setStatus(prev => ({ ...prev, pendingRequest: true }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to follow');
    }
  };

  const startChat = async () => {
    try {
      const { data } = await api.post(`/rooms/dm/${userId}`);
      navigate(`/chat?room=${data._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const getButtonLabel = () => {
    if (!status) return '...';
    if (status.iFollow) return 'Following';
    if (status.pendingRequest) return 'Requested';
    return 'Follow';
  };

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.textPrimary, fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 20px' }}>

        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: c.pinkDark, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 28, fontWeight: 500, color: c.pinkPale
          }}>
            {userId?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>username</div>
            <div style={{ fontSize: 13, color: c.textMuted, marginTop: 2 }}>
              {status?.isMutual ? '🟢 You follow each other' : ''}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <button
            onClick={handleFollow}
            disabled={status?.iFollow || status?.pendingRequest}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
              background: status?.iFollow ? c.surfaceLight : c.pink,
              color: status?.iFollow ? c.textPrimary : '#fff',
              fontWeight: 500, fontSize: 14, cursor: 'pointer'
            }}
          >
            {getButtonLabel()}
          </button>

          <button
            onClick={startChat}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8,
              border: `1px solid ${c.border}`, background: 'transparent',
              color: c.textPrimary, fontWeight: 500, fontSize: 14, cursor: 'pointer'
            }}
          >
            Message
          </button>
        </div>

        {!status?.isMutual && (
          <div style={{
            fontSize: 12, color: c.textMuted, background: c.surface,
            padding: '10px 14px', borderRadius: 8, lineHeight: 1.5
          }}>
            {status?.iFollow
              ? "You follow them, but they don't follow you back yet — your message will go to their requests."
              : "You don't follow each other yet — your message will appear as a request."}
          </div>
        )}
      </div>
    </div>
  );
}