// server/routes/user.routes.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth.middleware');
const Follow = require('../models/Follow');
const Post = require('../models/Post');
const { upload, uploadToCloudinary } = require('../config/cloudinary');

// GET /api/users — list all users except yourself
// This powers a simple "discover people" page
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.userId } })
      .select('username avatar bio isPrivate');

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id/profile
router.get('/:id/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username avatar bio isPrivate');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Count followers — how many people follow THIS user
    const followersCount = await Follow.countDocuments({
      following: req.params.id
    });

    // Count following — how many people THIS user follows
    const followingCount = await Follow.countDocuments({
      follower: req.params.id
    });

    // Count this user's posts
const postsCount = await Post.countDocuments({
  author: req.params.id
});

    // Is this MY OWN profile?
    const isOwnProfile = req.params.id === req.user.userId;

    res.json({
      user,
      followersCount,
      followingCount,
      postsCount,
      isOwnProfile
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/me — update your own profile
router.put('/me', auth, async (req, res) => {
  try {
    const { bio, isPrivate, username } = req.body;

    const updates = {};

    if (bio !== undefined) updates.bio = bio;
    if (isPrivate !== undefined) updates.isPrivate = isPrivate;
    if (username !== undefined) updates.username = username;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).select('username email avatar bio isPrivate');

    res.json(user);

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: 'Username already taken'
      });
    }

    res.status(500).json({
      message: err.message
    });
  }
});

// POST /api/users/me/avatar — upload a new profile picture
router.post('/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded'
      });
    }

    // Upload image buffer to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      'linksy/avatars'
    );

    // Save Cloudinary URL in MongoDB
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        avatar: result.secure_url
      },
      {
        new: true
      }
    ).select('username email avatar bio isPrivate');

    res.json(user);

  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({
      message: err.message
    });
  }
});
// GET /api/users/:id — get one user's public profile info
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username avatar bio isPrivate');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json(user);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;