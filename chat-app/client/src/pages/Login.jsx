import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { connectSocket } = useSocket();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', form);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setTimeout(() => connectSocket(), 100); // ← delay ensures token is saved first

      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, fontFamily: 'sans-serif' }}>
      <h2>Login to LinKsy</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
        />
        <button
         onClick={handleSubmit}
         disabled={!form.email || !form.password}
          style={{ padding: 10, background: '#1D9E75', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          Login
        </button>
        <p>Don't have an account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
}