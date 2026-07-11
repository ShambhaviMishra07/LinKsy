// client/src/pages/OTPVerify.jsx

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

export default function OTPVerify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { connectSocket } = useSocket();

  // userId and email passed via navigation state from Login page
  const { userId, email } = location.state || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60); // resend cooldown
  const inputRefs = useRef([]);

  // Redirect if no userId (someone navigated here directly)
  useEffect(() => {
    if (!userId) navigate('/login');
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // only keep last character
    setOtp(newOtp);
    setError('');

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (index === 5 && value) {
      const full = [...newOtp.slice(0, 5), value].join('');
      if (full.length === 6) handleVerify(full);
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace moves to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code) => {
    const finalCode = code || otp.join('');
    if (finalCode.length < 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setVerifying(true);
    try {
      const { data } = await api.post('/auth/verify-otp', {
        userId,
        otp: finalCode
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        ...data.user,
        id: data.user.id || data.user._id
      }));
      setTimeout(() => connectSocket(), 100);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      setOtp(['', '', '', '', '', '']); // clear inputs on wrong code
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { userId });
      setCountdown(60);
      setError('');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0a1e 0%, #2d0f35 30%, #0d0d1a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{ position: 'fixed', width: 400, height: 400, borderRadius: '50%', background: '#D4537E', filter: 'blur(80px)', opacity: 0.15, top: -100, left: -100, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: 300, height: 300, borderRadius: '50%', background: '#7B2FBE', filter: 'blur(80px)', opacity: 0.15, bottom: -80, right: -80, pointerEvents: 'none' }} />

      <div style={{
        width: '100%', maxWidth: 420,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 28, padding: '48px 36px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        textAlign: 'center', position: 'relative'
      }}>
        {/* Logo */}
        <div style={{ fontSize: 28, fontWeight: 300, color: '#F4C0D1', marginBottom: 28 }}>
          lin<span style={{ color: '#ED93B1', fontWeight: 600 }}>K</span>sy
        </div>

        <div style={{ fontSize: 44, marginBottom: 16 }}>🔐</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
          Check your email
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 32 }}>
          We sent a 6-digit code to<br />
          <span style={{ color: '#ED93B1', fontWeight: 500 }}>{email}</span>
        </p>

        {/* 6-digit OTP input boxes */}
        <div
          style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}
          onPaste={handlePaste}
        >
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              autoFocus={i === 0}
              style={{
                width: 48, height: 56,
                textAlign: 'center', fontSize: 22, fontWeight: 600,
                background: digit ? 'rgba(212,83,126,0.15)' : 'rgba(255,255,255,0.07)',
                border: `2px solid ${error ? '#ff6b8a' : digit ? '#D4537E' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 12, color: '#fff', outline: 'none',
                transition: 'all 0.2s', caretColor: '#D4537E'
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{ fontSize: 13, color: '#ff6b8a', marginBottom: 16 }}>{error}</div>
        )}

        <button
          onClick={() => handleVerify()}
          disabled={verifying || otp.join('').length < 6}
          style={{
            width: '100%', padding: 14, marginBottom: 16,
            background: otp.join('').length === 6
              ? 'linear-gradient(135deg, #D4537E, #993556)'
              : 'rgba(255,255,255,0.07)',
            border: 'none', borderRadius: 14,
            cursor: otp.join('').length === 6 ? 'pointer' : 'not-allowed',
            color: '#fff', fontSize: 15, fontWeight: 600,
            boxShadow: otp.join('').length === 6 ? '0 8px 24px rgba(212,83,126,0.4)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          {verifying ? 'Verifying...' : 'Verify code'}
        </button>

        {/* Resend button with countdown */}
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Didn't get it?{' '}
          {countdown > 0 ? (
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>Resend in {countdown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{ background: 'none', border: 'none', color: '#ED93B1', fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0 }}
            >
              {resending ? 'Sending...' : 'Resend code'}
            </button>
          )}
        </div>

        <button
          onClick={() => navigate('/login')}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', marginTop: 20 }}
        >
          ← Back to sign in
        </button>
      </div>
    </div>
  );
}