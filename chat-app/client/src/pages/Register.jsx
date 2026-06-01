import { useState, useEffect } from 'react'; // Added useEffect
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { connectSocket } = useSocket();

  // Added: Set page title when component loads
  useEffect(() => {
    document.title = 'Register | LinKsy';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data } = await api.post('/auth/register', form);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Small delay before socket connection
      setTimeout(() => connectSocket(), 100);

      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: '80px auto',
        padding: 24,
        fontFamily: 'sans-serif'
      }}
    >
      <h2>Create account</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <input
          placeholder="Username"
          autoComplete="username" // Added for browser autofill support
          value={form.username}
          onChange={(e) =>
            setForm({
              ...form,
              username: e.target.value
            })
          }
          style={{
            padding: 10,
            borderRadius: 6,
            border: '1px solid #ccc'
          }}
        />

        <input
          placeholder="Email"
          type="email"
          autoComplete="email" // Added for browser autofill support
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value
            })
          }
          style={{
            padding: 10,
            borderRadius: 6,
            border: '1px solid #ccc'
          }}
        />

        <input
          placeholder="Password"
          type="password"
          autoComplete="new-password" // Added for browser autofill support
          value={form.password}
          onChange={(e) =>
            setForm({
              ...form,
              password: e.target.value
            })
          }
          style={{
            padding: 10,
            borderRadius: 6,
            border: '1px solid #ccc'
          }}
        />

        <button
          type="submit"
          onClick={handleSubmit}
          style={{
            padding: 10,
            background: '#1D9E75',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          Register
        </button>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}