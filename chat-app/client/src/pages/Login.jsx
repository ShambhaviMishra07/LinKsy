// client/src/pages/Login.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

// Import the shared components from Register.jsx
// Since they're defined in the same file, extract them to a shared file
// OR just duplicate the small ones here for now

export default function Login() {
  const navigate = useNavigate();
  const { connectSocket } = useSocket();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        ...data.user,
        id: data.user.id || data.user._id
      }));
      setTimeout(() => connectSocket(), 100);
      navigate('/home');
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Invalid email or password' });
    } finally {
      setSubmitting(false);
    }
  };

  const inp = (field) => ({
    width: '100%', padding: '12px 16px 12px 42px',
    background: 'rgba(255,255,255,0.07)',
    border: `1px solid ${errors[field] ? '#ff6b8a' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 12, color: '#fff', fontSize: 14,
    outline: 'none', boxSizing: 'border-box'
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0a1e 0%, #2d0f35 30%, #1a0520 60%, #0d0d1a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'fixed', width: 400, height: 400, borderRadius: '50%', background: '#D4537E', filter: 'blur(80px)', opacity: 0.2, top: -100, left: -100, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: 300, height: 300, borderRadius: '50%', background: '#7B2FBE', filter: 'blur(80px)', opacity: 0.2, bottom: -80, right: -80, pointerEvents: 'none' }} />

      <div style={{
        width: '100%', maxWidth: 420,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 28, padding: '40px 36px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        position: 'relative'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, fontWeight: 300, color: '#F4C0D1', letterSpacing: 1 }}>
            lin<span style={{ color: '#ED93B1', fontWeight: 600 }}>K</span>sy
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Connect. Share. Stay safe.</div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Welcome back</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>Sign in to continue</div>

        {errors.general && (
          <div style={{ background: 'rgba(255,107,138,0.15)', border: '1px solid #ff6b8a', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ff6b8a', marginBottom: 16 }}>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>✉</span>
              <input
                style={inp('email')}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })); }}
              />
            </div>
            {errors.email && <div style={{ fontSize: 11, color: '#ff6b8a', marginTop: 4 }}>{errors.email}</div>}
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }}>🔒</span>
              <input
                style={{ ...inp('password'), paddingRight: 44 }}
                type={showPwd ? 'text' : 'password'}
                placeholder="Your password"
                value={form.password}
                onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })); }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'rgba(255,255,255,0.3)', padding: 0 }}
              >
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
            {errors.password && <div style={{ fontSize: 11, color: '#ff6b8a', marginTop: 4 }}>{errors.password}</div>}
          </div>

          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <span style={{ fontSize: 12, color: '#ED93B1', cursor: 'pointer' }}>Forgot password?</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: 14,
              background: submitting ? 'rgba(212,83,126,0.4)' : 'linear-gradient(135deg, #D4537E 0%, #993556 100%)',
              border: 'none', borderRadius: 14, cursor: submitting ? 'not-allowed' : 'pointer',
              color: '#fff', fontSize: 15, fontWeight: 600,
              boxShadow: '0 8px 24px rgba(212,83,126,0.4)',
              transition: 'all 0.2s'
            }}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 24 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#ED93B1', fontWeight: 500, textDecoration: 'none' }}>Create one</Link>
          </div>
        </form>
      </div>
    </div>
  );
}