// client/src/context/SocketContext.jsx

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null); // ref to track the actual socket instance

  const connectSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // ← KEY FIX: if socket already exists and is connected, don't create a new one
    if (socketRef.current?.connected) {
      console.log('⚡ Socket already connected, skipping reconnect');
      return;
    }

    // Clean up old socket if it exists but isn't connected
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

    socketRef.current = newSocket; // store in ref
    setSocket(newSocket);          // also store in state for components to use
  };

  useEffect(() => {
    connectSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);