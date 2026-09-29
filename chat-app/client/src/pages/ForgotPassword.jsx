// client/src/pages/ForgotPassword.jsx

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=code, 3=new password, 4=done
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const inputRefs = useRef([]);

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a0a1e 0%, #2d0f35 30%, #0d0d1a 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
  };

  const cardStyle = {
    width: '100%', maxWidth: 420,
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 28, padding: '40px 36px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
  };

  const inputStyle = (hasError) => ({
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.07)',
    border: `1px solid ${hasError ? '#ff6b8a' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 12, color: '#fff', fontSize: 14,
    outline: 'none', boxSizing: 'border-box'
  });

  const btnStyle = (active = true) => ({
    width: '100%', padding: 14, marginTop: 8,
    background: active
      ? 'linear-gradient(135deg, #D4537E, #993556)'
      : 'rgba(255,255,255,0.07)',
    border: 'none', borderRadius: 14,
    cursor: active ? 'pointer' : 'not-allowed',
    color: '#fff', fontSize: 15, fontWeight: 600,
    boxShadow: active ? '0 8px 24px rgba(212,83,126,0.4)' : 'none',
    transition: 'all 0.2s'
  });

  const logo = (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <div style={{ fontSize: 28, fontWeight: 300, color: '#F4C0D1' }}>
        lin<span style={{ color: '#ED93B1', fontWeight: 600 }}>K</span>sy
      </div>
    </div>
  );

  // ── Step 1: Enter email ──────────────────────────────────────
  const handleRequestCode = async () => {
    if (!email.trim()) return setError('Please enter your email');
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      if (data.userId) {
        setUserId(data.userId);
        setStep(2);
      } else {
        // userId not returned means email not found but we show success anyway
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Enter 6-digit code ───────────────────────────────
  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (index === 5 && value) {
      const full = [...newCode.slice(0, 5), value].join('');
      if (full.length === 6) handleVerifyCode(full);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (codeStr) => {
    const finalCode = codeStr || code.join('');
    if (finalCode.length < 6) return setError('Enter all 6 digits');
    setLoading(true); setError('');
    try {
      await api.post('/auth/verify-reset-code', { userId, code: finalCode });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Set new password ─────────────────────────────────
  const handleResetPassword = async () => {
    if (!newPassword) return setError('Password is required');
    if (newPassword.length < 8) return setError('At least 8 characters required');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { userId, newPassword });
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={{ position: 'fixed', width: 400, height: 400, borderRadius: '50%', background: '#D4537E', filter: 'blur(80px)', opacity: 0.15, top: -100, left: -100, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: 300, height: 300, borderRadius: '50%', background: '#7B2FBE', filter: 'blur(80px)', opacity: 0.15, bottom: -80, right: -80, pointerEvents: 'none' }} />

      <div style={cardStyle}>
        {logo}

        {/* ── Step 1: Email input ── */}
        {step === 1 && (
          <>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 6 }}>Forgot password?</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>
              Enter your email and we'll send you a 6-digit reset code.
            </div>
            {error && <div style={{ fontSize: 13, color: '#ff6b8a', marginBottom: 14 }}>{error}</div>}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Email Address</label>
              <input
                style={inputStyle(!!error)}
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleRequestCode()}
                autoFocus
              />
            </div>
            <button style={btnStyle(!loading)} onClick={handleRequestCode} disabled={loading}>
              {loading ? 'Sending...' : 'Send reset code'}
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', marginTop: 16, width: '100%', textAlign: 'center' }}
            >
              ← Back to sign in
            </button>
          </>
        )}

        {/* ── Step 2: 6-digit code ── */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📬</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Enter reset code</div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 28, lineHeight: 1.6 }}>
                We sent a 6-digit code to<br />
                <span style={{ color: '#ED93B1', fontWeight: 500 }}>{email}</span>
              </p>
            </div>
            {error && <div style={{ fontSize: 13, color: '#ff6b8a', marginBottom: 14, textAlign: 'center' }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleCodeChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  autoFocus={i === 0}
                  style={{
                    width: 46, height: 54,
                    textAlign: 'center', fontSize: 22, fontWeight: 600,
                    background: digit ? 'rgba(212,83,126,0.15)' : 'rgba(255,255,255,0.07)',
                    border: `2px solid ${error ? '#ff6b8a' : digit ? '#D4537E' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 10, color: '#fff', outline: 'none',
                    transition: 'all 0.2s'
                  }}
                />
              ))}
            </div>
            <button
              style={btnStyle(code.join('').length === 6 && !loading)}
              onClick={() => handleVerifyCode()}
              disabled={code.join('').length < 6 || loading}
            >
              {loading ? 'Verifying...' : 'Verify code'}
            </button>
            <button
              onClick={() => { setStep(1); setCode(['', '', '', '', '', '']); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', marginTop: 16, width: '100%', textAlign: 'center' }}
            >
              ← Try a different email
            </button>
          </>
        )}

        {/* ── Step 3: New password ── */}
        {step === 3 && (
          <>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 6 }}>Set new password</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>
              Choose a strong password for your account.
            </div>
            {error && <div style={{ fontSize: 13, color: '#ff6b8a', marginBottom: 14 }}>{error}</div>}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  style={{ ...inputStyle(!!error), paddingRight: 44 }}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setError(''); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'rgba(255,255,255,0.3)', padding: 0 }}
                >
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase' }}>Confirm Password</label>
              <input
                style={inputStyle(confirmPassword && newPassword !== confirmPassword)}
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <div style={{ fontSize: 11, color: '#ff6b8a', marginTop: 4 }}>Passwords do not match</div>
              )}
            </div>
            <button style={btnStyle(!loading)} onClick={handleResetPassword} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </>
        )}

        {/* ── Step 4: Success ── */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 10 }}>Password reset!</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 28 }}>
              Your password has been updated successfully. Sign in with your new password.
            </p>
            <button style={btnStyle()} onClick={() => navigate('/login')}>
              Go to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}