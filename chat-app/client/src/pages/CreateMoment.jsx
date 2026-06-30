// client/src/pages/CreateMoment.jsx

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { colors as c } from '../theme';

export default function CreateMoment() {
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
    setPreview(URL.createObjectURL(selected)); // instant local preview, no upload yet
  };

  const handlePost = async () => {
    if (!file) return;
    setPosting(true);

    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('caption', caption);

      await api.post('/moments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate('/home'); // back to feed, new moment ring should now appear
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post moment');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.textPrimary, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', borderBottom: `0.5px solid ${c.border}`
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: c.textPrimary, fontSize: 20, cursor: 'pointer' }}>
          ←
        </button>
        <span style={{ fontSize: 16, fontWeight: 500 }}>New Moment</span>
        <button
          onClick={handlePost}
          disabled={!file || posting}
          style={{
            background: 'none', border: 'none',
            color: file ? c.pinkLight : c.textMuted,
            fontSize: 14, fontWeight: 500,
            cursor: file ? 'pointer' : 'default'
          }}
        >
          {posting ? 'Posting...' : 'Share'}
        </button>
      </div>

      {/* Preview area */}
      <div
        onClick={() => !preview && fileInputRef.current?.click()}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: c.surface, margin: 20, borderRadius: 16, cursor: !preview ? 'pointer' : 'default',
          overflow: 'hidden', minHeight: 380
        }}
      >
        {preview ? (
          file?.type?.startsWith('video') ? (
            <video src={preview} controls style={{ width: '100%', maxHeight: 480, objectFit: 'contain' }} />
          ) : (
            <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 480, objectFit: 'contain' }} />
          )
        ) : (
          <div style={{ textAlign: 'center', color: c.textMuted }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>+</div>
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

      {/* Caption — only show once media is selected */}
      {preview && (
        <div style={{ padding: '0 20px 24px' }}>
          <input
            value={caption}
            onChange={e => setCaption(e.target.value.slice(0, 200))}
            placeholder="Add a caption..."
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 8,
              border: `1px solid ${c.border}`, background: c.surface,
              color: c.textPrimary, fontSize: 14, boxSizing: 'border-box'
            }}
          />
          <div style={{
            fontSize: 11, color: c.textMuted, marginTop: 10, textAlign: 'center'
          }}>
            This Moment disappears in 24 hours
          </div>
        </div>
      )}
    </div>
  );
}