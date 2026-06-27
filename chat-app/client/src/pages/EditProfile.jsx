// client/src/pages/EditProfile.jsx — placeholder for now

import { useNavigate } from 'react-router-dom';
import { colors as c } from '../theme';

export default function EditProfile() {
  const navigate = useNavigate();
  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.textPrimary, padding: 24, fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: c.textMuted, marginBottom: 16, cursor: 'pointer' }}>
        ← Back
      </button>
      <h2>Edit profile — coming next</h2>
    </div>
  );
}