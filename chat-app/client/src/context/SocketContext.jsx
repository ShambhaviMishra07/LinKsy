// client/src/context/SocketContext.jsx

import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // If a socket already exists, disconnect it first
    // This prevents double connections
    setSocket(prev => {
      if (prev) prev.disconnect();
      return null;
    });

    const newSocket = io('http://localhost:5000', {
      auth: { token },
      // These options make reconnection more reliable
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('🔴 Connection error:', err.message);
      setIsConnected(false);
    });

    setSocket(newSocket);
    return newSocket;
  };

  useEffect(() => {
    const s = connectSocket();
    // Cleanup on unmount
    return () => { if (s) s.disconnect(); };
  }, []);

  // Expose connectSocket so Login page can call it after saving token
  return (
    <SocketContext.Provider value={{ socket, isConnected, connectSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);