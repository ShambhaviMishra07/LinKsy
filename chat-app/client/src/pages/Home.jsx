// client/src/pages/Home.jsx

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlus } from '@tabler/icons-react';
import api from '../api/axios';
import { colors as c } from '../theme';
import BottomNav from '../components/BottomNav';
import NotificationBell from '../components/NotificationBell';
import SOSPill from '../components/SOSPill';
import PostCard from '../components/PostCard';

export default function Home() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [momentGroups, setMomentGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

 useEffect(() => {
  loadMoments();
  loadFeed();
}, []);


const loadMoments = async () => {
  try {
    const { data } = await api.get('/moments/feed');
    setMomentGroups(data);
  } catch (err) {
    console.error('Failed to load moments:', err.message);
  }
};

const loadFeed = async () => {
  try {
    const { data } = await api.get('/posts/feed');
    setPosts(data);
  } catch (err) {
    console.error('Feed error:', err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ background: c.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

   <div
  style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: `0.5px solid ${c.border}`
  }}
>
  <span
    style={{
      fontSize: 19,
      fontWeight: 500,
      color: c.pinkLight
    }}
  >
    lin<span style={{ color: c.pinkPale }}>K</span>sy
  </span>

  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }}
  >
    {/* Create menu */}
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowCreateMenu(!showCreateMenu)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: c.textPrimary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <IconPlus size={22} stroke={1.6} />
      </button>

      {showCreateMenu && (
        <div
          style={{
            position: 'absolute',
            top: '130%',
            right: 0,
            width: 180,
            background: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            overflow: 'hidden',
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}
        >
          {[
            {
              label: '📸 New post',
              path: '/posts/create'
            },
            {
              label: '⭕ New Moment',
              path: '/moments/create'
            }
          ].map(item => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setShowCreateMenu(false);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                color: c.textPrimary,
                fontSize: 13,
                textAlign: 'left',
                cursor: 'pointer',
                borderBottom: `0.5px solid ${c.border}`
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>

    <SOSPill />

    <NotificationBell />
  </div>
</div>
     

      <div style={{ flex: 1, maxWidth: 480, width: '100%', margin: '0 auto' }}>

    {/* Moments row */}
<div
  style={{
    display: 'flex',
    gap: 14,
    padding: '14px 16px',
    overflowX: 'auto',
    borderBottom: `0.5px solid ${c.border}`
  }}
>
  {/* Your own moment */}
  <div
    onClick={() => navigate('/moments/create')}
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 5,
      flexShrink: 0,
      cursor: 'pointer'
    }}
  >
    <div
      style={{
        width: 58,
        height: 58,
        borderRadius: '50%',
        background: c.surface,
        border: `1.5px dashed ${c.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <span
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: c.pinkDark,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 500,
          color: c.pinkPale
        }}
      >
        {user.username?.charAt(0)?.toUpperCase()}
      </span>

      <div
        style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: c.pink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${c.bg}`,
          fontSize: 12,
          color: '#fff'
        }}
      >
        +
      </div>
    </div>

    <span style={{ fontSize: 11, color: c.textMuted }}>
      Your moment
    </span>
  </div>

  {momentGroups
    .filter(group => group.author._id !== user.id)
    .map(group => (
      <div
        key={group.author._id}
        onClick={() =>
          navigate('/moments/view', {
            state: { group }
          })
        }
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 5,
          flexShrink: 0,
          cursor: 'pointer'
        }}
      >
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            padding: 2,
            background: group.hasUnseen
              ? `linear-gradient(135deg, ${c.pinkLight}, ${c.pinkDark})`
              : c.surfaceLight
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: c.surface,
              border: `2px solid ${c.bg}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              color: c.textSecondary,
              overflow: 'hidden'
            }}
          >
            {group.author.avatar ? (
              <img
                src={group.author.avatar}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              group.author.username.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        <span style={{ fontSize: 11, color: c.textMuted }}>
          {group.author.username}
        </span>
      </div>
    ))}

  {momentGroups.length === 0 && (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        color: c.textMuted,
        fontSize: 12,
        paddingLeft: 8
      }}
    >
      No moments yet
    </div>
  )}
</div>
      
    {/* Feed */}
<div style={{ padding: '8px 0' }}>

  {loading && (
    <p
      style={{
        textAlign: 'center',
        color: c.textMuted,
        fontSize: 13
      }}
    >
      Loading feed...
    </p>
  )}

  {!loading && posts.length === 0 && (
    <div
      style={{
        textAlign: 'center',
        color: c.textMuted,
        padding: '60px 20px'
      }}
    >
      <div
        style={{
          fontSize: 14,
          color: c.textSecondary,
          marginBottom: 8
        }}
      >
        No posts yet
      </div>

      <div
        style={{
          fontSize: 12,
          marginBottom: 16
        }}
      >
        Follow people to see their posts
      </div>

      <button
        onClick={() => navigate('/discover')}
        style={{
          padding: '8px 20px',
          borderRadius: 8,
          border: 'none',
          background: c.pink,
          color: '#fff',
          fontSize: 13,
          cursor: 'pointer'
        }}
      >
        Discover people
      </button>
    </div>
  )}

  {posts.map(post => (
    <PostCard
      key={post._id}
      post={post}
      currentUserId={user.id}
    />
  ))}
</div>           

     
      </div>

      <BottomNav />
    </div>
  );
}