// client/src/components/PostCard.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconFlower, IconCloud } from '@tabler/icons-react';
import api from '../api/axios';
import { colors as c } from '../theme';
import CommentsSheet from './CommentsSheet';


export default function PostCard({ post, currentUserId }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.likes?.includes(currentUserId));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);

  const handleLike = async () => {
    try {
      const { data } = await api.post(`/posts/${post._id}/like`);
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ marginBottom: 36, background: c.surface }}>

      {/* Post header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px'
      }}>
        <div
          onClick={() => navigate(`/profile/${post.author._id}`)}
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: c.pinkDark, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 13, fontWeight: 500,
            color: c.pinkPale, cursor: 'pointer', overflow: 'hidden', flexShrink: 0
          }}
        >
          {post.author.avatar
            ? <img src={post.author.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : post.author.username.charAt(0).toUpperCase()
          }
        </div>
        <span
          onClick={() => navigate(`/profile/${post.author._id}`)}
          style={{ fontWeight: 500, fontSize: 13, color: c.textPrimary, cursor: 'pointer' }}
        >
          {post.author.username}
        </span>
        <span style={{ fontSize: 11, color: c.textMuted, marginLeft: 'auto' }}>
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Media */}
      {post.mediaType === 'video' ? (
        <video
          src={post.mediaUrl}
          controls
          style={{ width: '100%', maxHeight: 500, objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <img
          src={post.mediaUrl}
          alt="post"
          style={{ width: '100%', maxHeight: 500, objectFit: 'cover', display: 'block' }}
        />
      )}

      {/* Actions */}
      <div style={{ padding: '10px 16px 4px', display: 'flex', gap: 16, alignItems: 'center' }}>
        <button onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <IconFlower
            size={26}
            stroke={1.5}
            color={liked ? c.pink : c.textSecondary}
            fill={liked ? c.pink : 'none'}
          />
        </button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {/* <IconCloud size={26} stroke={1.5} color={c.textSecondary} /> */}

        <CommentsSheet
  postId={post._id}
  commentsCount={post.commentsCount}
  currentUserId={currentUserId}
/>

        </button>
      </div>

      {/* Likes count */}
      {likesCount > 0 && (
        <div style={{ padding: '0 16px 4px', fontSize: 13, fontWeight: 500, color: c.textPrimary }}>
          {likesCount} like{likesCount !== 1 ? 's' : ''}
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div style={{ padding: '2px 16px 14px', fontSize: 13, color: c.textPrimary }}>
          <span style={{ fontWeight: 500 }}>{post.author.username}</span>{' '}
          {post.caption}
        </div>
      )}
    </div>
  );
}