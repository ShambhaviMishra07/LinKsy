// client/src/pages/SOSContacts.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { colors as c } from '../theme';

export default function SOSContacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { data } = await api.get('/sos/contacts');
      setContacts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setAllUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const addContact = async (userId) => {
    try {
      await api.post(`/sos/contacts/${userId}`);
      loadContacts();
      setShowAdd(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add contact');
    }
  };

  const removeContact = async (contactDocId) => {
    try {
      await api.delete(`/sos/contacts/${contactDocId}`);
      setContacts(prev => prev.filter(c => c._id !== contactDocId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ background: c.bg, minHeight: '100vh', color: c.textPrimary }}>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 20px', borderBottom: `0.5px solid ${c.border}`
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: c.textPrimary, fontSize: 20, cursor: 'pointer' }}>
          ←
        </button>
        <span style={{ fontSize: 16, fontWeight: 500 }}>Trusted contacts</span>
        <div style={{ width: 24 }} />
      </div>

      <div style={{ maxWidth: 460, margin: '0 auto', padding: '20px' }}>

        <p style={{ fontSize: 13, color: c.textMuted, marginBottom: 20, lineHeight: 1.6 }}>
          These people will be alerted instantly if you trigger SOS. Add people you trust to act in an emergency.
        </p>

        {contacts.map(c2 => (
          <div key={c2._id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 0', borderBottom: `0.5px solid ${c.border}`
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%', background: c.pinkDark,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 500, color: c.pinkPale, flexShrink: 0
            }}>
              {c2.contact.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{c2.contact.username}</div>
              {c2.label && <div style={{ fontSize: 12, color: c.textMuted }}>{c2.label}</div>}
            </div>
            <button
              onClick={() => removeContact(c2._id)}
              style={{ background: 'none', border: 'none', color: c.danger, fontSize: 13, cursor: 'pointer' }}
            >
              Remove
            </button>
          </div>
        ))}

        {contacts.length === 0 && (
          <p style={{ color: c.textMuted, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            No trusted contacts yet
          </p>
        )}

        <button
          onClick={() => { setShowAdd(!showAdd); if (!showAdd) loadAllUsers(); }}
          style={{
            width: '100%', marginTop: 16, padding: '10px 0', borderRadius: 8,
            border: 'none', background: c.pink, color: '#fff',
            fontWeight: 500, fontSize: 14, cursor: 'pointer'
          }}
        >
          + Add trusted contact
        </button>

        {showAdd && (
          <div style={{ marginTop: 16 }}>
            {allUsers
              .filter(u => !contacts.some(c2 => c2.contact._id === u._id))
              .map(u => (
                <div key={u._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 0', borderBottom: `0.5px solid ${c.border}`
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: c.surfaceLight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, color: c.textSecondary, flexShrink: 0
                  }}>
                    {u.username.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ flex: 1, fontSize: 13 }}>{u.username}</span>
                  <button
                    onClick={() => addContact(u._id)}
                    style={{
                      padding: '5px 12px', borderRadius: 6, border: 'none',
                      background: c.surfaceLight, color: c.textPrimary,
                      fontSize: 12, cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}