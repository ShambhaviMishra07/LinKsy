// server/routes/user.routes.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth.middleware');
const Follow = require('../models/Follow');


// GET /api/users — list all users except yourself
// This powers a simple "discover people" page
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.userId } })
      .select('username avatar bio isPrivate'); // never send password

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username avatar bio isPrivate');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Count followers — how many people follow THIS user
    const followersCount = await Follow.countDocuments({ following: req.params.id });

    // Count following — how many people THIS user follows
    const followingCount = await Follow.countDocuments({ follower: req.params.id });

    // Post count — 0 for now until Posts model exists
    const postsCount = 0; // await Post.countDocuments({ author: req.params.id });

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

// GET /api/users/:id — get one user's public profile info
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username avatar bio isPrivate');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;