// client/src/components/BottomNav.jsx — full updated version

import { useNavigate, useLocation } from 'react-router-dom';
import { IconSpiral, IconSparkles, IconFeather, IconCircle } from '@tabler/icons-react';
import { colors as c } from '../theme';
import useUnreadMessages from '../hooks/useUnreadMessages';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const unreadCount = useUnreadMessages();

  const tabs = [
    { path: '/home', Icon: IconSpiral, label: 'Home' },
    { path: '/discover', Icon: IconSparkles, label: 'Search' },
    { path: '/chat', Icon: IconFeather, label: 'Messages', badge: unreadCount },
    { path: `/profile/${user.id}`, Icon: IconCircle, label: 'Account' }
  ];

  const isActive = (path) => {
    if (path.startsWith('/profile')) return location.pathname.startsWith('/profile');
    if (path === '/chat') return location.pathname.startsWith('/chat');
    return location.pathname === path;
  };

  return (
    <div style={{
      position: 'sticky', bottom: 0, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-around',
      padding: '12px 0', background: c.bg,
      borderTop: `0.5px solid ${c.border}`, zIndex: 50
    }}>
      {tabs.map(tab => {
        const active = isActive(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '4px 16px', position: 'relative'
            }}
          >
            <tab.Icon
              size={24}
              stroke={1.6}
              color={active ? c.pinkLight : c.textMuted}
            />
            {/* Unread badge — only shows when count > 0 */}
            {tab.badge > 0 && (
              <span style={{
                position: 'absolute',
                top: 0,
                right: 8,
                background: c.danger,
                color: '#fff',
                fontSize: 9,
                fontWeight: 600,
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1.5px solid ${c.bg}`
              }}>
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}