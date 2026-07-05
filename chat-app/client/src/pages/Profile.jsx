// client/src/pages/Profile.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { colors as c } from '../theme';
import BottomNav from '../components/BottomNav';
import NotificationBell from '../components/NotificationBell';
import SOSPill from '../components/SOSPill';
import { IconPlus } from '@tabler/icons-react';


export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [followStatus, setFollowStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateMenu, setShowCreateMenu] = useState(false);


  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users/${userId}/profile`);
      setProfile(data);

      // Only fetch follow status if viewing someone else's profile
      if (!data.isOwnProfile) {
        const { data: statusData } = await api.get(`/follow/status/${userId}`);
        setFollowStatus(statusData);
      }
    } catch (err) {
      console.error('Failed to load profile:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (followStatus?.iFollow) {
        await api.delete(`/follow/${userId}`);
        setFollowStatus(prev => ({ ...prev, iFollow: false }));
        setProfile(prev => ({ ...prev, followersCount: prev.followersCount - 1 }));
      } else if (followStatus?.pendingRequest) {
        await api.delete(`/follow/requests/${userId}/cancel`);
        setFollowStatus(prev => ({ ...prev, pendingRequest: false }));
      } else {
        const { data } = await api.post(`/follow/${userId}`);
        if (data.status === 'accepted') {
          setFollowStatus(prev => ({ ...prev, iFollow: true }));
          setProfile(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
        } else {
          setFollowStatus(prev => ({ ...prev, pendingRequest: true }));
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const startChat = async () => {
    try {
      const { data } = await api.post(`/rooms/dm/${userId}`);
       navigate(`/chat/${data._id}`, { state: { room: data } });
    } catch (err) {
      console.error(err);
    }
  };

  const getButtonLabel = () => {
    if (!followStatus) return '...';
    if (followStatus.iFollow) return 'Following';
    if (followStatus.pendingRequest) return 'Requested';
    return 'Follow';
  };

  if (loading) {
    return (
      <div style={{ background: c.bg, minHeight: '100vh', color: c.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ background: c.bg, minHeight: '100vh', color: c.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Profile not found.
      </div>
    );
  }

  const { user, followersCount, followingCount, postsCount, isOwnProfile } = profile;

    return (
    <div style={{ background: c.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: `0.5px solid ${c.border}`
  }}>
    <span style={{ fontSize: 16, fontWeight: 500, color: c.textPrimary }}>
      {user.username}
    </span>
    {/* {isOwnProfile && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <SOSPill />
        <NotificationBell />
      </div>
    )} */}

    
{isOwnProfile && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
    <button
      onClick={() => setShowCreateMenu(!showCreateMenu)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.textPrimary, padding: 4 }}
    >
      <IconPlus size={22} stroke={1.6} />
    </button>
    <SOSPill />
    <NotificationBell />

    {showCreateMenu && (
      <div style={{
        position: 'absolute', top: '130%', right: 0,
        background: c.surface, border: `1px solid ${c.border}`,
        borderRadius: 12, overflow: 'hidden', zIndex: 50, width: 180,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
      }}>
        {[
          { label: '📸 New post', path: '/posts/create' },
          { label: '⭕ New Moment', path: '/moments/create' }
        ].map(item => (
          <button
            key={item.path}
            onClick={() => { navigate(item.path); setShowCreateMenu(false); }}
            style={{
              display: 'block', width: '100%', padding: '12px 16px',
              background: 'none', border: 'none', color: c.textPrimary,
              fontSize: 13, textAlign: 'left', cursor: 'pointer',
              borderBottom: `0.5px solid ${c.border}`
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    )}
  </div>
)}
  </div>



      {/* Profile content */}
      <div style={{ flex: 1, maxWidth: 480, width: '100%', margin: '0 auto', padding: '24px 20px' }}>

        {/* Avatar + stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: c.pinkDark, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 28, fontWeight: 500,
            color: c.pinkPale, flexShrink: 0, overflow: 'hidden'
          }}>
            {user.avatar
              ? <img src={user.avatar} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user.username.charAt(0).toUpperCase()
            }
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 500, color: c.textPrimary }}>{postsCount}</div>
              <div style={{ fontSize: 12, color: c.textMuted }}>Posts</div>
            </div>
            <div
              onClick={() => navigate(`/profile/${userId}/followers`)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ fontSize: 17, fontWeight: 500, color: c.textPrimary }}>{followersCount}</div>
              <div style={{ fontSize: 12, color: c.textMuted }}>Followers</div>
            </div>
            <div
              onClick={() => navigate(`/profile/${userId}/following`)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ fontSize: 17, fontWeight: 500, color: c.textPrimary }}>{followingCount}</div>
              <div style={{ fontSize: 12, color: c.textMuted }}>Following</div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p style={{ fontSize: 13, color: c.textSecondary, marginBottom: 16, lineHeight: 1.5 }}>
            {user.bio}
          </p>
        )}

        {/* Action buttons */}
        {isOwnProfile ? (
          <button
            onClick={() => navigate('/profile/edit')}
            style={{
              width: '100%', padding: '9px 0', borderRadius: 8,
              border: `1px solid ${c.border}`, background: 'transparent',
              color: c.textPrimary, fontWeight: 500, fontSize: 14, cursor: 'pointer'
            }}
          >
            Edit profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleFollowToggle}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 8,
                border: followStatus?.iFollow || followStatus?.pendingRequest ? `1px solid ${c.border}` : 'none',
                background: followStatus?.iFollow || followStatus?.pendingRequest ? 'transparent' : c.pink,
                color: followStatus?.iFollow || followStatus?.pendingRequest ? c.textPrimary : '#fff',
                fontWeight: 500, fontSize: 14, cursor: 'pointer'
              }}
            >
              {getButtonLabel()}
            </button>
            <button
              onClick={startChat}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 8,
                border: `1px solid ${c.border}`, background: 'transparent',
                color: c.textPrimary, fontWeight: 500, fontSize: 14, cursor: 'pointer'
              }}
            >
              Message
            </button>
          </div>
        )}

        {!isOwnProfile && !followStatus?.isMutual && (
          <div style={{
            fontSize: 12, color: c.textMuted, background: c.surface,
            padding: '10px 14px', borderRadius: 8, lineHeight: 1.5, marginTop: 12
          }}>
            {followStatus?.iFollow
              ? "You follow them, but they don't follow you back yet — your message will go to their requests."
              : "You don't follow each other yet — your message will appear as a request."}
          </div>
        )}

        {/* Posts grid placeholder */}
        <div style={{
          marginTop: 28, paddingTop: 20, borderTop: `0.5px solid ${c.border}`,
          textAlign: 'center', color: c.textMuted, fontSize: 13
        }}>
          <i className="ti ti-photo" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} aria-hidden="true"></i>
          No posts yet
        </div>
      </div>

      <BottomNav />
    </div>
  );
}