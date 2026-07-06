// client/src/components/CommentsSheet.jsx

import { useState, useRef } from 'react';
import api from '../api/axios';
import { colors as c } from '../theme';
import { IconCloud } from '@tabler/icons-react';

export default function CommentsSheet({
  postId,
  commentsCount,
  currentUserId
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [input, setInput] = useState('');
  const [count, setCount] = useState(commentsCount || 0);
  const [posting, setPosting] = useState(false);

  const inputRef = useRef(null);

  const loadComments = async () => {
    try {
      const { data } = await api.get(`/comments/${postId}`);
      setComments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    loadComments();

    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  };

  const handlePost = async () => {
    if (!input.trim() || posting) return;

    setPosting(true);

    try {
      const { data } = await api.post(`/comments/${postId}`, {
        content: input
      });

      setComments(prev => [...prev, data]);
      setCount(prev => prev + 1);
      setInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);

      setComments(prev =>
        prev.filter(comment => comment._id !== commentId)
      );

      setCount(prev => prev - 1);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Comment button */}
      <button
        onClick={handleOpen}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}
      >
        <IconCloud
          size={26}
          stroke={1.5}
          color={c.textSecondary}
        />

        {count > 0 && (
          <span
            style={{
              fontSize: 12,
              color: c.textMuted
            }}
          >
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 480,
              margin: '0 auto',
              background: c.surface,
              borderRadius: '20px 20px 0 0',
              maxHeight: '75vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Handle */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '12px 0 4px'
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: c.border
                }}
              />
            </div>

            <div
              style={{
                padding: '8px 20px 12px',
                borderBottom: `0.5px solid ${c.border}`,
                fontWeight: 500,
                fontSize: 14,
                color: c.textPrimary
              }}
            >
              Comments
            </div>

            {/* Comments */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 20px'
              }}
            >
              {comments.length === 0 && (
                <p
                  style={{
                    textAlign: 'center',
                    color: c.textMuted,
                    fontSize: 13,
                    marginTop: 20
                  }}
                >
                  No comments yet. Be the first!
                </p>
              )}

            {comments.map(comment => (
  <div
    key={comment._id}
    style={{
      display: 'flex',
      gap: 10,
      marginBottom: 16
    }}
  >
    {/* Avatar */}
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        background: c.pinkDark,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        color: c.pinkPale,
        fontWeight: 500,
        flexShrink: 0,
        overflow: 'hidden'
      }}
    >
      {comment.author.avatar ? (
        <img
          src={comment.author.avatar}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        comment.author.username.charAt(0).toUpperCase()
      )}
    </div>

    {/* Username + Comment */}
    <div style={{ flex: 1 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: c.textPrimary,
          marginBottom: 4
        }}
      >
        {comment.author.username}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10
        }}
      >
        <div
          style={{
            flex: 1,
            fontSize: 13,
            color: c.textPrimary,
            lineHeight: 1.45,
            wordBreak: 'break-word'
          }}
        >
          {comment.content}
        </div>

        <div
          style={{
            fontSize: 11,
            color: c.textMuted,
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          {new Date(comment.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>

    {/* Delete own comment */}
    {comment.author._id === currentUserId && (
      <button
        onClick={() => handleDelete(comment._id)}
        style={{
          background: 'none',
          border: 'none',
          color: c.textMuted,
          fontSize: 12,
          cursor: 'pointer',
          alignSelf: 'flex-start'
        }}
      >
        ✕
      </button>
    )}
  </div>
))}
 </div>

            {/* Input */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: '12px 20px',
                borderTop: `0.5px solid ${c.border}`,
                alignItems: 'center'
              }}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePost()}
                placeholder="Add a comment..."
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: 20,
                  border: `1px solid ${c.border}`,
                  background: c.bg,
                  color: c.textPrimary,
                  fontSize: 13,
                  outline: 'none'
                }}
              />

              <button
                onClick={handlePost}
                disabled={!input.trim() || posting}
                style={{
                  background: 'none',
                  border: 'none',
                  color: input.trim() ? c.pinkLight : c.textMuted,
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}