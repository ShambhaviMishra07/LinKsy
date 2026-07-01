// client/src/pages/SOSTrack.jsx

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { colors as c } from '../theme';

export default function SOSTrack() {
  const { alertId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [alert, setAlert] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const hasBeepedRef = useRef(false); // ensures the beep only plays ONCE, not on every update

  useEffect(() => {
    loadAlert();
  }, [alertId]);

  const loadAlert = async () => {
    try {
      const { data } = await api.get(`/sos/active/${alertId}`);
      setAlert(data);
      if (data.lastLocation?.lat) {
        setCurrentLocation(data.lastLocation);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Play a sharp attention-grabbing beep ──
  // Different from the sender's siren — this is a short, distinct double-beep,
  // since this device isn't in danger, it just needs to notice
  const playBeep = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();

    const playTone = (startTime) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square'; // sharp, piercing — good for a notification beep
      osc.frequency.value = 1000;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15); // quick fade out
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    };

    // Two quick beeps, 200ms apart — reads as "alert", not just a blip
    playTone(ctx.currentTime);
    playTone(ctx.currentTime + 0.25);
  };

  useEffect(() => {
    if (!socket || !alertId) return;

    // Join this SOS room so we receive the sender's live location stream
    socket.emit('join_sos_tracking', alertId);

    const onLocationUpdate = (data) => {
      // Beep only the FIRST time a location arrives in this session —
      // not on every single GPS update, or it would beep constantly
      if (!hasBeepedRef.current) {
        playBeep();
        hasBeepedRef.current = true;
      }
      setCurrentLocation({ lat: data.lat, lng: data.lng, updatedAt: data.timestamp });
    };

    socket.on('sos_location_update', onLocationUpdate);

    return () => {
      socket.off('sos_location_update', onLocationUpdate);
      socket.emit('leave_sos_alert', alertId);
    };
  }, [socket, alertId]);

  if (!alert) {
    return (
      <div style={{ background: c.bg, minHeight: '100vh', color: c.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading alert...
      </div>
    );
  }

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.textPrimary }}>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 20px', borderBottom: `0.5px solid ${c.border}`,
        background: c.danger
      }}>
        <button onClick={() => navigate('/home')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>
          ←
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>
          🚨 {alert.triggeredBy.username} needs help
        </span>
      </div>

      <div style={{ maxWidth: 460, margin: '0 auto', padding: '24px 20px' }}>

        <div style={{
          background: c.surface, borderRadius: 14, padding: '18px 20px', marginBottom: 16
        }}>
          <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 6 }}>Status</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: alert.status === 'active' ? c.danger : c.success }}>
            {alert.status === 'active' ? 'Emergency active' : 'Marked safe'}
          </div>
        </div>

        {currentLocation ? (
          <div style={{ background: c.surface, borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 10 }}>Last known location</div>
            <div style={{ fontSize: 13, color: c.textPrimary, marginBottom: 4 }}>
            Lat: {currentLocation.lat.toFixed(5)}, Lng: {currentLocation.lng.toFixed(5)}
            </div>

            <a
            href={`https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: c.pinkLight, fontSize: 13, textDecoration: 'underline' }}
            >
            Open in Google Maps
            </a>

            <div style={{ fontSize: 11, color: c.textMuted, marginTop: 10 }}>
            Updating live — last update just now
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: c.textMuted, fontSize: 13, padding: 30 }}>
            Waiting for location...
          </div>
        )}
      </div>
    </div>
  );
}