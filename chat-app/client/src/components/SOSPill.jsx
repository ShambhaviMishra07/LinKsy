// client/src/components/SOSPill.jsx

import { useNavigate } from 'react-router-dom';
import { colors as c } from '../theme';

export default function SOSPill() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/sos')}
      style={{
        padding: '5px 12px', borderRadius: 14, border: 'none',
        background: c.danger, color: '#fff', fontWeight: 600,
        fontSize: 12, letterSpacing: '0.3px', cursor: 'pointer',
        flexShrink: 0
      }}
    >
      SOS
    </button>
  );
}