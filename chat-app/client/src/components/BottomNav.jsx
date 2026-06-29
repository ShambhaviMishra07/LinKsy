
// client/src/components/BottomNav.jsx

import { useNavigate, useLocation } from 'react-router-dom';
import { IconSpiral, IconSparkles, IconFeather, IconCircle } from '@tabler/icons-react';
import { colors as c } from '../theme';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const tabs = [
    { path: '/home', Icon: IconSpiral, label: 'Home' },
    { path: '/discover', Icon: IconSparkles, label: 'Search' },
    { path: '/messages', Icon: IconFeather, label: 'Messages' },
    { path: `/profile/${user.id}`, Icon: IconCircle, label: 'Account' }
  ];

  const isActive = (path) => {
    if (path.startsWith('/profile')) return location.pathname.startsWith('/profile');
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
              padding: '4px 16px'
            }}
          >
            {/* Icon component from the package — stroke prop controls line thickness */}
            <tab.Icon
              size={24}
              stroke={1.6}
              color={active ? c.pinkLight : c.textMuted}
            />
          </button>
        );
      })}
    </div>
  );
}