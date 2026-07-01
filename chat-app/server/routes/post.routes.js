const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Follow = require('../models/Follow');
const User = require('../models/User');
const auth = require('../middleware/auth.middleware');
const { upload, uploadToCloudinary } = require('../config/cloudinary');

// ── CREATE A POST ──────────────────────────────────────────────
router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No media uploaded' });
    }

    const isVideo = req.file.mimetype.startsWith('video');
    const result = await uploadToCloudinary(
      req.file.buffer,
      'linksy/posts',
      isVideo ? 'video' : 'image'
    );

    const post = await Post.create({
      author: req.user.userId,
      mediaUrl: result.secure_url,
      mediaType: isVideo ? 'video' : 'image',
      caption: req.body.caption || ''
    });

    await post.populate('author', 'username avatar');

    // Update post count indirectly — profile route counts dynamically
    res.status(201).json(post);
  } catch (err) {
    console.error('Post error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── GET FEED (posts from people you follow) ────────────────────
router.get('/feed', auth, async (req, res) => {
  try {
    const following = await Follow.find({ follower: req.user.userId }).select('following');
    const ids = [...following.map(f => f.following), req.user.userId];

    const posts = await Post.find({ author: { $in: ids } })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET A USER'S POSTS ─────────────────────────────────────────
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── LIKE / UNLIKE A POST ───────────────────────────────────────
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const alreadyLiked = post.likes.includes(req.user.userId);

    if (alreadyLiked) {
      post.likes.pull(req.user.userId);
    } else {
      post.likes.push(req.user.userId);
    }

    await post.save();
    res.json({ liked: !alreadyLiked, likesCount: post.likes.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE A POST ──────────────────────────────────────────────
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.author.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;