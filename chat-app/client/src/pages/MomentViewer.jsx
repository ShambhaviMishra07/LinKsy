// client/src/pages/MomentViewer.jsx

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { colors as c } from '../theme';

export default function MomentViewer() {
  const navigate = useNavigate();
  const location = useLocation();
  const group = location.state?.group;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const moments = group?.moments || [];
  const current = moments[currentIndex];

  useEffect(() => {
    if (!current) return;

    // Mark as viewed
    api.post(`/moments/${current._id}/view`).catch(console.error);

    // Progress bar timer — 5 seconds per moment
    setProgress(0);
    const start = Date.now();
    const duration = 5000;

    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (elapsed >= duration) {
        clearInterval(timer);
        if (currentIndex < moments.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          navigate(-1); // all moments viewed
        }
      }
    }, 50);

    return () => clearInterval(timer);
  }, [currentIndex]);

  if (!group || moments.length === 0) {
    return (
      <div style={{ background: '#000', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        No moments to show
      </div>
    );
  }

  return (
    <div
      style={{ background: '#000', minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={() => {
        // Tap right side to advance, left side to go back
        if (currentIndex < moments.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          navigate(-1);
        }
      }}
    >
      {/* Progress bars */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 4, zIndex: 10 }}>
        {moments.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 1 }}>
            <div style={{
              height: '100%', borderRadius: 1, background: '#fff',
              width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%',
              transition: i === currentIndex ? 'none' : undefined
            }} />
          </div>
        ))}
      </div>

      {/* Author info */}
      <div style={{
        position: 'absolute', top: 28, left: 16, display: 'flex',
        alignItems: 'center', gap: 10, zIndex: 10
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', background: c.pinkDark,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, color: c.pinkPale, fontWeight: 500, overflow: 'hidden'
        }}>
          {group.author.avatar
            ? <img src={group.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : group.author.username.charAt(0).toUpperCase()
          }
        </div>
        <span style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>{group.author.username}</span>
      </div>

      {/* Close button */}
      <button
        onClick={e => { e.stopPropagation(); navigate(-1); }}
        style={{
          position: 'absolute', top: 28, right: 16, background: 'none',
          border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', zIndex: 10
        }}
      >
        ✕
      </button>

      {/* Media */}
      {current.mediaType === 'video' ? (
        <video
          key={current._id}
          src={current.mediaUrl}
          autoPlay
          style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain' }}
        />
      ) : (
        <img
          key={current._id}
          src={current.mediaUrl}
          alt=""
          style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain' }}
        />
      )}

      {/* Caption */}
      {current.caption && (
        <div style={{
          position: 'absolute', bottom: 40, left: 20, right: 20,
          color: '#fff', fontSize: 14, textAlign: 'center',
          textShadow: '0 1px 4px rgba(0,0,0,0.8)'
        }}>
          {current.caption}
        </div>
      )}
    </div>
  );
}