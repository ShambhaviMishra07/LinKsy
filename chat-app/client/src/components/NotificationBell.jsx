// client/src/components/NotificationBell.jsx

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { colors as c } from '../theme';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUnreadCount();
    // Poll every 15 seconds for new notifications
    const interval = setInterval(loadUnreadCount, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.count);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDropdown = async () => {
    if (!open) {
      // Load notifications when opening
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data);
        // Mark all as read
        await api.post('/notifications/mark-read');
        setUnreadCount(0);
      } catch (err) {
        console.error(err);
      }
    }
    setOpen(!open);
  };

  const getMessage = (n) => {
    switch (n.type) {
      case 'follow': return 'started following you';
      case 'follow_request': return 'requested to follow you';
      case 'follow_accepted': return 'accepted your follow request';
      default: return 'interacted with you';
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={toggleDropdown}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 20, color: c.textPrimary, position: 'relative', padding: 4
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: c.pink, color: '#fff', fontSize: 10,
            borderRadius: '50%', width: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 500
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '130%', right: 0, width: 320,
          background: c.surface, border: `1px solid ${c.border}`,
          borderRadius: 12, maxHeight: 400, overflowY: 'auto',
          zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, fontWeight: 500, fontSize: 14, color: c.textPrimary }}>
            Notifications
          </div>

          {notifications.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: c.textMuted, fontSize: 13 }}>
              No notifications yet
            </div>
          )}

          {notifications.map(n => (
            <div
              key={n._id}
              onClick={() => navigate(`/profile/${n.sender._id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', cursor: 'pointer',
                borderBottom: `1px solid ${c.border}`
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: c.pinkDark, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 14, fontWeight: 500,
                color: c.pinkPale, flexShrink: 0
              }}>
                {n.sender?.username?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ flex: 1, fontSize: 13, color: c.textPrimary }}>
                <b>{n.sender?.username}</b> {getMessage(n)}
              </div>
              <div style={{ fontSize: 11, color: c.textMuted, flexShrink: 0 }}>
                {timeAgo(n.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}