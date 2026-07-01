// client/src/pages/SOS.jsx

import { useNavigate } from 'react-router-dom';
import { colors as c } from '../theme';
import SOSButton from '../components/SOSButton';
import ShareLocationButton from '../components/ShareLocationButton';
import BottomNav from '../components/BottomNav';

export default function SOS() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: '🎥',
      title: 'Record video',
      subtitle: 'Front and back camera',
      onClick: () => alert('Coming in Phase 3 — camera recording'),
      enabled: false
    },
    {
      icon: '🗺️',
      title: 'Safety map',
      subtitle: 'Nearby hospitals, police',
      onClick: () => alert('Coming in Phase 4 — nearby safe places'),
      enabled: false
    },
    {
      icon: '👥',
      title: 'Trusted contacts',
      subtitle: 'Manage who gets alerted',
      onClick: () => navigate('/sos/contacts'),
      enabled: true
    }
  ];

  return (
    <div
      style={{
        background: c.bg,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderBottom: `0.5px solid ${c.border}`
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: c.textPrimary,
            fontSize: 20,
            cursor: 'pointer'
          }}
        >
          ←
        </button>

        <span style={{ fontSize: 16, fontWeight: 500 }}>
          Emergency SOS
        </span>
      </div>

      <div
        style={{
          flex: 1,
          maxWidth: 460,
          width: '100%',
          margin: '0 auto',
          padding: '20px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 16
          }}
        >
          <SOSButton />
        </div>

        <p
          style={{
            fontSize: 13,
            color: c.textMuted,
            textAlign: 'center',
            maxWidth: 280,
            margin: '0 auto 20px',
            lineHeight: 1.6
          }}
        >
          SOS sounds an alarm and notifies your trusted contacts.
        </p>

        {/* Share location now stands on its own, not inside the grid below */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 24
          }}
        >
          <ShareLocationButton />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 12
          }}
        >
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              style={{
                background: c.surface,
                borderRadius: 14,
                padding: '16px 12px',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                opacity: action.enabled ? 1 : 0.7
              }}
            >
              <span style={{ fontSize: 20 }}>{action.icon}</span>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: c.textPrimary
                }}
              >
                {action.title}
              </span>

              <span
                style={{
                  fontSize: 10,
                  color: c.textMuted,
                  lineHeight: 1.4
                }}
              >
                {action.subtitle}
              </span>

              {!action.enabled && (
                <span
                  style={{
                    fontSize: 9,
                    color: c.pinkLight,
                    background: c.pinkDark,
                    padding: '2px 6px',
                    borderRadius: 8,
                    alignSelf: 'flex-start'
                  }}
                >
                  Coming soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}