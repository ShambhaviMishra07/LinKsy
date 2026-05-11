import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext'; 

export default function Register(){
    const [form, setForm] = useState({username:'', email:'', password:''});
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            const {data} = await api.post('/auth/register', form);
        
        //save the token in localstorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        connectSocket();

        navigate('/chat');
        } catch (err){
            setError(err.resopnse?.data?.message || 'something went wrong');
        }
    };

     return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h2>Create account</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
        />
        <input
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}