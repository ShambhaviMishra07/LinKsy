// client/src/components/BottomNav.jsx

import { useNavigate, useLocation } from 'react-router-dom';
import { colors as c } from '../theme';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const tabs = [
    { path: '/chat', icon: 'ti-spiral', label: 'Home' },
    { path: '/discover', icon: 'ti-sparkles', label: 'Search' },
    { path: '/messages', icon: 'ti-feather', label: 'Messages' },
    { path: `/profile/${user.id}`, icon: 'ti-circle', label: 'Account' }
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
      {tabs.map(tab => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          aria-label={tab.label}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, color: isActive(tab.path) ? c.pinkLight : c.textMuted,
            padding: '4px 16px'
          }}
        >
          <i className={`ti ${tab.icon}`} style={{ fontSize: 24 }} aria-hidden="true"></i>
        </button>
      ))}
    </div>
  );
}