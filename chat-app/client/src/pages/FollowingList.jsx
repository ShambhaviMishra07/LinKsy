// client/src/pages/FollowingList.jsx — identical structure, just different endpoint

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { colors as c } from '../theme';

export default function FollowingList() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/follow/${userId}/following`)
      .then(({ data }) => setFollowing(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.textPrimary }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 20px', borderBottom: `0.5px solid ${c.border}`
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: c.textPrimary, fontSize: 20, cursor: 'pointer' }}>←</button>
        <span style={{ fontSize: 16, fontWeight: 500 }}>Following</span>
      </div>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        {loading && <p style={{ textAlign: 'center', color: c.textMuted, padding: 20 }}>Loading...</p>}
        {!loading && following.length === 0 && (
          <p style={{ textAlign: 'center', color: c.textMuted, padding: 40 }}>Not following anyone yet</p>
        )}
        {following.map(u => (
          <div
            key={u._id}
            onClick={() => navigate(`/profile/${u._id}`)}
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
            <span style={{ fontSize: 14, fontWeight: 500 }}>{u.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
}