
// client/src/pages/SOS.jsx — complete rewrite with share location as a card

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { colors as c } from '../theme';
import SOSButton from '../components/SOSButton';
import BottomNav from '../components/BottomNav';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import SOSCamera from '../components/SOSCamera';


export default function SOS() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [locationSharing, setLocationSharing] = useState(false);
  const [locationAlertId, setLocationAlertId] = useState(null);


  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraAlertId, setCameraAlertId] = useState(null);

  const watchIdRef = useRef(null);

  const startLocationStream = (alertId) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported on this device');
      return;
    }
    socket.emit('join_sos_alert', alertId);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        socket.emit('sos_location_update', {
          alertId,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (err) => console.error('Location error:', err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    watchIdRef.current = watchId;
  };

  const stopLocationStream = (alertId) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (socket && alertId) socket.emit('leave_sos_alert', alertId);
  };

  const handleShareLocation = async () => {
    if (locationSharing) {
      // ── Stop sharing ──
      try {
        await api.post(`/sos/resolve/${locationAlertId}`);
        stopLocationStream(locationAlertId);
        setLocationSharing(false);
        setLocationAlertId(null);
      } catch (err) {
        console.error(err);
      }
    } else {
      // ── Start sharing ──
      try {
        const { data } = await api.post('/sos/share-location');
        setLocationAlertId(data.alertId);
        setLocationSharing(true);
        startLocationStream(data.alertId);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to share location');
      }
    }
  };

  const handleRecordVideo = async () => {
  if (cameraOpen) {
    setCameraOpen(false);
    return;
  }

  try {
    // Reuse the location share endpoint to create an alertId for the room
    const { data } = await api.post('/sos/share-location');

    setCameraAlertId(data.alertId);
    setCameraOpen(true);
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to start recording');
  }
};


  return (
    <div style={{ background: c.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 20px', borderBottom: `0.5px solid ${c.border}`
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: c.textPrimary, fontSize: 20, cursor: 'pointer' }}>
          ←
        </button>
        <span style={{ fontSize: 16, fontWeight: 500 }}>Emergency SOS</span>
      </div>

      <div style={{ flex: 1, maxWidth: 480, width: '100%', margin: '0 auto', padding: '20px' }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <SOSButton />
        </div>

        <p style={{ fontSize: 13, color: c.textMuted, textAlign: 'center', maxWidth: 280, margin: '0 auto 24px', lineHeight: 1.6 }}>
          SOS sounds an alarm and notifies your trusted contacts.
        </p>

        {/* 2x2 grid — all four cards same size */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

          {/* Share location card */}
          <button
            onClick={handleShareLocation}
            style={{
              background: locationSharing ? '#0F2A1A' : c.surface,
              borderRadius: 14, padding: '18px 14px',
              border: locationSharing ? `1.5px solid ${c.success}` : 'none',
              textAlign: 'left', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 8
            }}
          >
            <span style={{ fontSize: 22 }}>📍</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: c.textPrimary }}>
              {locationSharing ? 'Sharing...' : 'Share location'}
            </span>
            <span style={{ fontSize: 11, color: locationSharing ? c.success : c.textMuted, lineHeight: 1.4 }}>
              {locationSharing ? 'Tap to stop sharing' : 'Live tracking link to contacts'}
            </span>
            {locationSharing && (
              <span style={{
                fontSize: 9, color: '#fff', background: c.success,
                padding: '2px 6px', borderRadius: 8, alignSelf: 'flex-start'
              }}>
                LIVE
              </span>
            )}
          </button>

          {/* Record video card */}
          <button
            onClick={handleRecordVideo}
            style={{
              background: c.surface, borderRadius: 14, padding: '18px 14px',
              border: 'none', textAlign: 'left', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 8, opacity: 1
            }}
          >
            <span style={{ fontSize: 22 }}>🎥</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: c.textPrimary }}>Record video</span>
            <span style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.4 }}>Front and back camera</span>
            
          </button>

         
         {/* Safety map card */}
        <button
          onClick={() => navigate('/sos/map')}
          style={{
            background: c.surface,
            borderRadius: 14,
            padding: '18px 14px',
            border: 'none',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            opacity: 1
          }}
        >
          <span style={{ fontSize: 22 }}>🗺️</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: c.textPrimary }}>
            Safety map
          </span>
          <span
            style={{
              fontSize: 11,
              color: c.textMuted,
              lineHeight: 1.4
            }}
          >
            Nearby hospitals, police
          </span>
        </button>



          {/* Trusted contacts card */}
          <button
            onClick={() => navigate('/sos/contacts')}
            style={{
              background: c.surface, borderRadius: 14, padding: '18px 14px',
              border: 'none', textAlign: 'left', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 8
            }}
          >
            <span style={{ fontSize: 22 }}>👥</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: c.textPrimary }}>Trusted contacts</span>
            <span style={{ fontSize: 11, color: c.textMuted, lineHeight: 1.4 }}>Manage who gets alerted</span>
          </button>

        </div>

        {cameraOpen && cameraAlertId && (
          <div style={{ marginTop: 20 }}>
            <SOSCamera
              alertId={cameraAlertId}
              onStop={() => {
                setCameraOpen(false);
                setCameraAlertId(null);
              }}
            />
          </div>
        )} 
      </div>

      <BottomNav />
    </div>
  );
}