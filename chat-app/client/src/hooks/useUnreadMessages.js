// client/src/hooks/useUnreadMessages.js

import { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';

export default function useUnreadMessages() {
  const [count, setCount] = useState(0);
  const { socket } = useSocket();

  useEffect(() => {
    // Load initial count on mount
    api.get('/rooms/unread-count')
      .then(({ data }) => setCount(data.count))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Real-time updates — fires whenever a new message arrives
    const onUnreadCount = ({ count }) => {
      setCount(count);
    };

    socket.on('unread_messages_count', onUnreadCount);
    return () => socket.off('unread_messages_count', onUnreadCount);
  }, [socket]);

  return count;
}