// client/src/pages/EditProfile.jsx

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { colors as c } from '../theme';



export default function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');

    const handleLogout = () => {
    const confirmed = window.confirm(
      'Are you sure you want to logout?'
    );

    if (!confirmed) return;

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    navigate('/login');
  };

  useEffect(() => {
    loadMyProfile();
  }, []);

  const loadMyProfile = async () => {
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      const { data } = await api.get(`/users/${localUser.id}`);
      setUser(data);
      setBio(data.bio || '');
      setUsername(data.username || '');
      setIsPrivate(data.isPrivate || false);
      setAvatarPreview(data.avatar || '');
    } catch (err) {
      console.error('Failed to load profile:', err.message);
    }
  };

  // ── Upload avatar immediately on file select ──
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview instantly while upload happens in background
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const { data } = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setAvatarPreview(data.avatar);

      // Keep localStorage in sync so sidebar/nav avatar updates too
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...localUser, avatar: data.avatar }));

    } catch (err) {
      setError(err.response?.data?.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Save bio / username / privacy ──
  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.put('/users/me', { bio, username, isPrivate });

      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...localUser, username: data.username }));

      navigate(`/profile/${localUser.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div style={{ background: c.bg, minHeight: '100vh', color: c.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.textPrimary }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', borderBottom: `0.5px solid ${c.border}`
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: c.textPrimary, fontSize: 20, cursor: 'pointer' }}>
          ←
        </button>
        <span style={{ fontSize: 16, fontWeight: 500 }}>Edit profile</span>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ background: 'none', border: 'none', color: c.pinkLight, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          {saving ? 'Saving...' : 'Done'}
        </button>
      </div>

      <div style={{ maxWidth: 420, margin: '0 auto', padding: '28px 20px' }}>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 88, height: 88, borderRadius: '50%', position: 'relative',
              cursor: 'pointer', overflow: 'hidden', background: c.pinkDark,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: uploadingAvatar ? 0.5 : 1 }} />
            ) : (
              <span style={{ fontSize: 32, color: c.pinkPale }}>{username.charAt(0).toUpperCase()}</span>
            )}
            {uploadingAvatar && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>
                Uploading...
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ background: 'none', border: 'none', color: c.pinkLight, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            Change profile photo
          </button>
        </div>

        {error && <p style={{ color: c.danger, fontSize: 13, marginBottom: 14 }}>{error}</p>}

        {/* Username */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, color: c.textMuted, display: 'block', marginBottom: 6 }}>Username</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: `1px solid ${c.border}`, background: c.surface,
              color: c.textPrimary, fontSize: 14, boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, color: c.textMuted, display: 'block', marginBottom: 6 }}>Bio</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value.slice(0, 150))}
            rows={3}
            placeholder="Write something about yourself..."
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: `1px solid ${c.border}`, background: c.surface,
              color: c.textPrimary, fontSize: 14, resize: 'none',
              boxSizing: 'border-box', fontFamily: 'inherit'
            }}
          />
          <div style={{ textAlign: 'right', fontSize: 11, color: c.textMuted, marginTop: 4 }}>
            {bio.length}/150
          </div>
        </div>

        {/* Private account toggle */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 0', borderTop: `0.5px solid ${c.border}`
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Private account</div>
            <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
              Only approved followers can see your posts
            </div>
          </div>
          <div
            onClick={() => setIsPrivate(!isPrivate)}
            style={{
              width: 44, height: 26, borderRadius: 13, cursor: 'pointer',
              background: isPrivate ? c.pink : c.surfaceLight, position: 'relative',
              transition: 'background 0.2s', flexShrink: 0
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 3, left: isPrivate ? 21 : 3,
              transition: 'left 0.2s'
            }} />
          </div>
        </div>
      </div>

      {/* Logout button — place this after the isPrivate toggle div */}
<div style={{ marginTop: 24 }}>
  <button
    onClick={handleLogout}
    style={{
      width: '15%',
      padding: '12px 0',
      borderRadius: 10,
      border: 'none',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: 600,
      letterSpacing: '0.3px',
      color: '#ffffff',

      // Blue gradient with shine effect
      background: 'linear-gradient(135deg,  #c385cb 50%, #1558B0 100%)',

      // Shine layer using box-shadow
      boxShadow: `
        0 4px 15px rgba(61, 199, 114, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.25)
      `,

      // Smooth hover transition
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={e => {
      e.target.style.boxShadow = `
        0 6px 20px rgba(79, 142, 247, 0.6),
        inset 0 1px 0 rgba(255, 255, 255, 0.3)
      `;
      e.target.style.transform = 'translateY(-1px)';
    }}
    onMouseLeave={e => {
      e.target.style.boxShadow = `
        0 4px 15px rgba(79, 142, 247, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.25)
      `;
      e.target.style.transform = 'translateY(0)';
    }}
  >
    Logout
  </button>
</div>
    </div>
  );
}