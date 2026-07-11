// client/src/pages/VerifyEmail.jsx

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); return; }

    api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(({ data }) => {
        if (data.message === 'verified' || data.message === 'already_verified') {
          setStatus('success');
        } else {
          setStatus('error');
        }
      })
      .catch(err => {
        console.error('Verify error:', err.response?.data);
        setStatus('error');
      });
  }, []);

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a0a1e 0%, #2d0f35 30%, #0d0d1a 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
  };

  const cardStyle = {
    width: '100%', maxWidth: 400, textAlign: 'center',
    background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 28,
    padding: '48px 36px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)'
  };

  const btnStyle = {
    width: '100%', padding: 14, marginTop: 24,
    background: 'linear-gradient(135deg, #D4537E, #993556)',
    border: 'none', borderRadius: 14, cursor: 'pointer',
    color: '#fff', fontSize: 15, fontWeight: 600,
    boxShadow: '0 8px 24px rgba(212,83,126,0.4)'
  };

  const logo = (
    <div style={{ fontSize: 28, fontWeight: 300, color: '#F4C0D1', marginBottom: 28 }}>
      lin<span style={{ color: '#ED93B1', fontWeight: 600 }}>K</span>sy
    </div>
  );

  if (status === 'loading') return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {logo}
        <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>Verifying your email...</div>
      </div>
    </div>
  );

  if (status === 'success') return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {logo}
        <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 600, marginBottom: 10 }}>Email verified!</div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7 }}>
          Your LinKsy account is now active. Sign in to start connecting.
        </p>
        <button style={btnStyle} onClick={() => navigate('/login?verified=true')}>
          Go to Sign In
        </button>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {logo}
        <div style={{ fontSize: 52, marginBottom: 16 }}>❌</div>
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 600, marginBottom: 10 }}>Verification failed</div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.7 }}>
          This link may be invalid. Try registering again or request a new verification email.
        </p>
        <button style={btnStyle} onClick={() => navigate('/register')}>
          Register again
        </button>
        <button
          onClick={() => navigate('/resend-verification')}
          style={{ background: 'none', border: 'none', color: '#ED93B1', fontSize: 13, cursor: 'pointer', marginTop: 14, display: 'block', width: '100%' }}
        >
          Resend verification email
        </button>
      </div>
    </div>
  );
}