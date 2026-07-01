// client/src/components/ShareLocationButton.jsx

import { useState, useRef } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { colors as c } from '../theme';

export default function ShareLocationButton() {
  const { socket } = useSocket();
  const [sharing, setSharing] = useState(false);
  const [activeAlertId, setActiveAlertId] = useState(null);
  const watchIdRef = useRef(null);

  const startLocationStream = (alertId) => {
    if (!navigator.geolocation) {
      alert('Location is not supported on this device');
      return;
    }

    socket.emit('join_sos_alert', alertId);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socket.emit('sos_location_update', {
          alertId,
          lat: latitude,
          lng: longitude
        });
      },
      (error) => console.error('Location error:', error.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    watchIdRef.current = watchId;
  };

  const stopLocationStream = (alertId) => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (socket && alertId) {
      socket.emit('leave_sos_alert', alertId);
    }
  };

  const handleStartSharing = async () => {
    setSharing(true);
    try {
      const { data } = await api.post('/sos/share-location');
      setActiveAlertId(data.alertId);
      startLocationStream(data.alertId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to share location');
    } finally {
      setSharing(false);
    }
  };

  const handleStopSharing = async () => {
    if (!activeAlertId) return;
    try {
      await api.post(`/sos/resolve/${activeAlertId}`);
      stopLocationStream(activeAlertId);
      setActiveAlertId(null);
    } catch (err) {
      console.error(err);
    }
  };

  if (activeAlertId) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: c.success, fontWeight: 500, marginBottom: 4, fontSize: 13 }}>
          📍 Sharing live location
        </div>
        <button
          onClick={handleStopSharing}
          style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: c.surfaceLight, color: c.textPrimary,
            fontWeight: 500, fontSize: 13, cursor: 'pointer'
          }}
        >
          Stop sharing
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartSharing}
      disabled={sharing}
      style={{
        padding: '10px 20px', borderRadius: 10, border: 'none',
        background: c.surface, color: c.textPrimary,
        fontWeight: 500, fontSize: 13, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8
      }}
    >
      📍 {sharing ? 'Starting...' : 'Share my location'}
    </button>
  );
}