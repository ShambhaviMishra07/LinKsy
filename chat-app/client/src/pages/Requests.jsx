// client/src/pages/Requests.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { colors as c } from '../theme';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data } = await api.get('/follow/requests');
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await api.post(`/follow/requests/${requestId}/accept`);
      // Remove from list immediately — optimistic UI update
      setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await api.post(`/follow/requests/${requestId}/reject`);
      setRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject');
    }
  };

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.textPrimary, fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Follow requests</h2>
          <button
            onClick={() => navigate('/chat')}
            style={{ background: 'none', border: 'none', color: c.textMuted, fontSize: 13, cursor: 'pointer' }}
          >
            ← Back
          </button>
        </div>

        {loading && <p style={{ color: c.textMuted, fontSize: 14 }}>Loading...</p>}

        {!loading && requests.length === 0 && (
          <p style={{ color: c.textMuted, fontSize: 14 }}>No pending follow requests.</p>
        )}

        {requests.map(req => (
          <div
            key={req._id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 0', borderBottom: `1px solid ${c.border}`
            }}
          >
            <div
              onClick={() => navigate(`/profile/${req.from._id}`)}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: c.pinkDark, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 16, fontWeight: 500,
                color: c.pinkPale, cursor: 'pointer', flexShrink: 0
              }}
            >
              {req.from.username.charAt(0).toUpperCase()}
            </div>

            <div
              onClick={() => navigate(`/profile/${req.from._id}`)}
              style={{ flex: 1, cursor: 'pointer' }}
            >
              <div style={{ fontWeight: 500, fontSize: 14 }}>{req.from.username}</div>
              <div style={{ fontSize: 12, color: c.textMuted }}>wants to follow you</div>
            </div>

            <button
              onClick={() => handleAccept(req._id)}
              style={{
                padding: '7px 14px', borderRadius: 8, border: 'none',
                background: c.pink, color: '#fff', fontWeight: 500,
                fontSize: 13, cursor: 'pointer'
              }}
            >
              Accept
            </button>
            <button
              onClick={() => handleReject(req._id)}
              style={{
                padding: '7px 14px', borderRadius: 8,
                border: `1px solid ${c.border}`, background: 'transparent',
                color: c.textPrimary, fontWeight: 500, fontSize: 13, cursor: 'pointer'
              }}
            >
              Reject
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}