// client/src/pages/CreatePost.jsx

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { colors as c } from '../theme';

export default function CreatePost() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handlePost = async () => {
    if (!file) return;
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('caption', caption);
      await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/home');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.textPrimary, display: 'flex', flexDirection: 'column' }}>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', borderBottom: `0.5px solid ${c.border}`
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: c.textPrimary, fontSize: 20, cursor: 'pointer' }}>
          ←
        </button>
        <span style={{ fontSize: 16, fontWeight: 500 }}>New post</span>
        <button
          onClick={handlePost}
          disabled={!file || posting}
          style={{
            background: 'none', border: 'none',
            color: file ? c.pinkLight : c.textMuted,
            fontSize: 14, fontWeight: 500, cursor: file ? 'pointer' : 'default'
          }}
        >
          {posting ? 'Posting...' : 'Share'}
        </button>
      </div>

      <div
        onClick={() => !preview && fileInputRef.current?.click()}
        style={{
          margin: 20, borderRadius: 16, overflow: 'hidden',
          background: c.surface, minHeight: 360,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: !preview ? 'pointer' : 'default'
        }}
      >
        {preview ? (
          file?.type?.startsWith('video') ? (
            <video src={preview} controls style={{ width: '100%', maxHeight: 480 }} />
          ) : (
            <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 480, objectFit: 'contain' }} />
          )
        ) : (
          <div style={{ textAlign: 'center', color: c.textMuted }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>+</div>
            <div style={{ fontSize: 13 }}>Tap to select photo or video</div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {preview && (
        <div style={{ padding: '0 20px 24px' }}>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value.slice(0, 2200))}
            placeholder="Write a caption..."
            rows={3}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: `1px solid ${c.border}`, background: c.surface,
              color: c.textPrimary, fontSize: 14, resize: 'none',
              boxSizing: 'border-box', fontFamily: 'inherit'
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ marginTop: 10, background: 'none', border: 'none', color: c.textMuted, fontSize: 12, cursor: 'pointer' }}
          >
            Change photo
          </button>
        </div>
      )}
    </div>
  );
}