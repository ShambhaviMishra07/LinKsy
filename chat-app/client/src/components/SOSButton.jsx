// client/src/components/SOSButton.jsx — simplified, alarm-only version

import { useState, useRef } from 'react';
import api from '../api/axios';
import { colors as c } from '../theme';

export default function SOSButton() {
  const [triggering, setTriggering] = useState(false);
  const [activeAlertId, setActiveAlertId] = useState(null);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);

  const startAlarm = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sawtooth';
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    gainNode.gain.value = 0.25;
    oscillator.start();
    oscillatorRef.current = oscillator;

    const sweepDuration = 0.6;
    const scheduleSweep = () => {
      const now = ctx.currentTime;
      oscillator.frequency.cancelScheduledValues(now);
      oscillator.frequency.setValueAtTime(600, now);
      oscillator.frequency.linearRampToValueAtTime(1400, now + sweepDuration / 2);
      oscillator.frequency.linearRampToValueAtTime(600, now + sweepDuration);
    };
    scheduleSweep();
    const interval = setInterval(scheduleSweep, sweepDuration * 1000);
    oscillatorRef.current.intervalId = interval;
  };

  const stopAlarm = () => {
    if (oscillatorRef.current) {
      clearInterval(oscillatorRef.current.intervalId);
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // ── No more geolocation code here — this button is alarm-only now ──
  const handleTrigger = async () => {
    setTriggering(true);
    try {
      const { data } = await api.post('/sos/trigger');
      setActiveAlertId(data.alertId);
      startAlarm();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to trigger SOS');
    } finally {
      setTriggering(false);
    }
  };

  const handleResolve = async () => {
    if (!activeAlertId) return;
    try {
      await api.post(`/sos/resolve/${activeAlertId}`);
      stopAlarm();
      setActiveAlertId(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {!activeAlertId ? (
        <button
          onClick={handleTrigger}
          disabled={triggering}
          style={{
            width: 100, height: 100, borderRadius: '50%', border: 'none',
            background: c.danger, color: '#fff', fontWeight: 600, fontSize: 16,
            cursor: 'pointer', boxShadow: `0 0 0 6px ${c.danger}33`
          }}
        >
          {triggering ? '...' : 'SOS'}
        </button>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: c.danger, fontWeight: 500, marginBottom: 10, fontSize: 14 }}>
            🚨 SOS active — contacts notified
          </div>
          <button
            onClick={handleResolve}
            style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: c.surfaceLight, color: c.textPrimary,
              fontWeight: 500, fontSize: 14, cursor: 'pointer'
            }}
          >
            I'm safe — stop alert
          </button>
        </div>
      )}
    </div>
  );
}