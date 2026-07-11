// client/src/pages/Register.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { colors as c } from '../theme';

export default function Register() {
  const navigate = useNavigate();
  const { connectSocket } = useSocket();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreed: false
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [strength, setStrength] = useState(0);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const checkStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    setStrength(score);
  };

  const strengthColor = ['#ff4444', '#ff8800', '#ffcc00', '#5DCAA5'][strength - 1] || '#ff4444';
  const strengthWidth = strength > 0 ? `${strength * 25}%` : '0%';

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!form.username.trim()) e.username = 'Username is required';
    else if (form.username.length < 3) e.username = 'At least 3 characters';
    else if (!/^[a-zA-Z0-9._]+$/.test(form.username)) e.username = 'Letters, numbers, dots, underscores only';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'At least 8 characters required';
    else if (!/[0-9]/.test(form.password)) e.password = 'Include at least one number';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.agreed) e.agreed = 'You must agree to continue';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
     await api.post('/auth/register', {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    username: form.username.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password
});

// No token returned — show email sent screen
setSubmitted(true);

    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';

      if (msg.toLowerCase().includes('email')) 
        setErrors({ email: msg });
      else if (msg.toLowerCase().includes('username')) 
        setErrors({ username: msg });
      else {
        setErrors({ general: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '12px 16px 12px 42px',
    background: 'rgba(255,255,255,0.07)',
    border: `1px solid ${errors[field] ? '#ff6b8a' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 12,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  });

  const iconStyle = {
    position: 'absolute', left: 14, top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 15, color: 'rgba(255,255,255,0.3)',
    pointerEvents: 'none', lineHeight: 1
  };

  if (submitted) {
    return (
      <AuthShell>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 10 }}>Check your email</div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 28 }}>
            We've sent a verification link to<br />
            <span style={{ color: '#ED93B1', fontWeight: 500 }}>{form.email}</span><br /><br />
            Click the link to activate your account. Check your spam folder too.
          </p>
          <PinkButton onClick={() => navigate('/login')}>Go to Sign In</PinkButton>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <LogoText />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Connect. Share. Stay safe.</div>
      </div>

      <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Create your account</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>Join LinKsy and start connecting</div>

      {errors.general && (
        <div style={{ background: 'rgba(255,107,138,0.15)', border: '1px solid #ff6b8a', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ff6b8a', marginBottom: 16 }}>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Name row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Field label="First Name" error={errors.firstName}>
            <span style={iconStyle}>👤</span>
            <input
              style={inputStyle('firstName')}
              placeholder="Shambhavi"
              value={form.firstName}
              onChange={e => update('firstName', e.target.value)}
            />
          </Field>
          <Field label="Last Name" error={errors.lastName}>
            <span style={iconStyle}>👤</span>
            <input
              style={inputStyle('lastName')}
              placeholder="Mishra"
              value={form.lastName}
              onChange={e => update('lastName', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Username" error={errors.username}>
          <span style={iconStyle}>@</span>
          <input
            style={inputStyle('username')}
            placeholder="shambhavi_m"
            value={form.username}
            onChange={e => update('username', e.target.value)}
          />
        </Field>

        <Field label="Email Address" error={errors.email}>
          <span style={iconStyle}>✉</span>
          <input
            style={inputStyle('email')}
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => update('email', e.target.value)}
          />
        </Field>

        <Field label="Password" error={errors.password}>
          <span style={iconStyle}>🔒</span>
          <PasswordInput
            value={form.password}
            onChange={v => { update('password', v); checkStrength(v); }}
            placeholder="Min. 8 characters"
            hasError={!!errors.password}
          />
          {/* Strength bar */}
          {form.password && (
            <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: strengthWidth, background: strengthColor, borderRadius: 2, transition: 'all 0.3s' }} />
            </div>
          )}
        </Field>

        <Field label="Confirm Password" error={errors.confirmPassword}>
          <span style={iconStyle}>🔒</span>
          <PasswordInput
            value={form.confirmPassword}
            onChange={v => update('confirmPassword', v)}
            placeholder="Repeat your password"
            hasError={!!errors.confirmPassword}
          />
        </Field>

        {/* Terms checkbox */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24 }}>
          <input
            type="checkbox"
            id="agreed"
            checked={form.agreed}
            onChange={e => { update('agreed', e.target.checked); }}
            style={{ width: 18, height: 18, accentColor: '#D4537E', marginTop: 2, flexShrink: 0, cursor: 'pointer' }}
          />
          <label htmlFor="agreed" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, cursor: 'pointer' }}>
            I agree to the{' '}
            <span style={{ color: '#ED93B1' }}>Terms of Service</span> and{' '}
            <span style={{ color: '#ED93B1' }}>Privacy Policy</span>
          </label>
        </div>
        {errors.agreed && <div style={{ fontSize: 11, color: '#ff6b8a', marginTop: -18, marginBottom: 12 }}>{errors.agreed}</div>}

        <PinkButton type="submit" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create Account'}
        </PinkButton>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#ED93B1', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
        </div>
      </form>
    </AuthShell>
  );
}

// ── Sub-components used only in auth pages ──────────────────────

function AuthShell({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0a1e 0%, #2d0f35 30%, #1a0520 60%, #0d0d1a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', width: 400, height: 400, borderRadius: '50%', background: '#D4537E', filter: 'blur(80px)', opacity: 0.2, top: -100, left: -100, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: 300, height: 300, borderRadius: '50%', background: '#7B2FBE', filter: 'blur(80px)', opacity: 0.2, bottom: -80, right: -80, pointerEvents: 'none' }} />

      <div style={{
        width: '100%', maxWidth: 440, position: 'relative',
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 28,
        padding: '40px 36px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
      }}>
        {children}
      </div>
    </div>
  );
}

function LogoText() {
  return (
    <div style={{ fontSize: 28, fontWeight: 300, color: '#F4C0D1', letterSpacing: 1 }}>
      lin<span style={{ color: '#ED93B1', fontWeight: 600 }}>K</span>sy
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {children}
      </div>
      {error && <div style={{ fontSize: 11, color: '#ff6b8a', marginTop: 4 }}>{error}</div>}
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, hasError }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '12px 44px 12px 42px',
          background: 'rgba(255,255,255,0.07)',
          border: `1px solid ${hasError ? '#ff6b8a' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 12, color: '#fff', fontSize: 14,
          outline: 'none', boxSizing: 'border-box'
        }}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'rgba(255,255,255,0.3)', padding: 0 }}
      >
        {show ? '🙈' : '👁'}
      </button>
    </div>
  );
}

function PinkButton({ children, onClick, type = 'button', disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '14px',
        background: disabled ? 'rgba(212,83,126,0.4)' : 'linear-gradient(135deg, #D4537E 0%, #993556 100%)',
        border: 'none', borderRadius: 14, cursor: disabled ? 'not-allowed' : 'pointer',
        color: '#fff', fontSize: 15, fontWeight: 600, letterSpacing: 0.3,
        boxShadow: disabled ? 'none' : '0 8px 24px rgba(212,83,126,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
        transition: 'all 0.2s'
      }}
    >
      {children}
    </button>
  );
}