// client/src/context/SocketContext.jsx

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);       // ← state version, for components to use
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);                    // ← ref version, for internal logic only (declared ONCE)

  const connectSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (socketRef.current?.connected) {
      console.log('⚡ Socket already connected, skipping reconnect');
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    console.log('🔄 Creating new socket connection...');

    const newSocket = io('http://localhost:5000', {
      auth: { token },
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

    socketRef.current = newSocket;
    setSocket(newSocket); // ← THIS LINE WAS MISSING/COMMENTED — critical fix
  };

  useEffect(() => {
    if (!socketRef.current) {
      connectSocket();
    }
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);