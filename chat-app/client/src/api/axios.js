import axios from 'axios';

const api = axios.create({
     baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

//Interceptor - runs before every request automatically
// this is the "attach the hotel key card" step
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if(token){
        config.headers.Authorization = `Bearer ${token}`;

    }
    return config;
});

export default api;