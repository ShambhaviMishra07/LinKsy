// server/routes/notification.routes.js

const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth.middleware');

// GET /api/notifications — get all my notifications, newest first
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.userId })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/notifications/unread-count — for the bell badge number
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.userId,
      isRead: false
    });

    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/notifications/mark-read — mark all as read when bell is opened
router.post('/mark-read', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;