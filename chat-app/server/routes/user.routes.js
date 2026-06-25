// server/routes/user.routes.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth.middleware');

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