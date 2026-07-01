// server/routes/moment.routes.js

const express = require('express');
const router = express.Router();
const Moment = require('../models/Moment');
const Follow = require('../models/Follow');
const auth = require('../middleware/auth.middleware');
const { upload, uploadToCloudinary } = require('../config/cloudinary');

// ── CREATE A MOMENT ────────────────────────────────────────────
// POST /api/moments
router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No media uploaded'
      });
    }

    // Determine whether the uploaded file is an image or video
    const isVideo = req.file.mimetype.startsWith('video');

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      'linksy/moments',
      isVideo ? 'video' : 'image'
    );

    // Expire after 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const moment = await Moment.create({
      author: req.user.userId,
      mediaUrl: result.secure_url,
      mediaType: isVideo ? 'video' : 'image',
      caption: req.body.caption || '',
      expiresAt
    });

    await moment.populate('author', 'username avatar');

    res.status(201).json(moment);

  } catch (err) {
    console.error('Moment upload error:', err);
    res.status(500).json({
      message: err.message
    });
  }
});

// ── GET MOMENTS FEED ───────────────────────────────────────────
// GET /api/moments/feed
router.get('/feed', auth, async (req, res) => {
  try {
    const myId = req.user.userId;

    const following = await Follow.find({ follower: myId }).select('following');
    const followingIds = following.map(f => f.following);

    // Include my own moments
    followingIds.push(myId);

    const moments = await Moment.find({
      author: { $in: followingIds }
    })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 });

    const grouped = {};

    moments.forEach(m => {
      const authorId = m.author._id.toString();

      if (!grouped[authorId]) {
        grouped[authorId] = {
          author: m.author,
          moments: [],
          hasUnseen: false
        };
      }

      grouped[authorId].moments.push(m);

      if (!m.viewedBy.includes(myId)) {
        grouped[authorId].hasUnseen = true;
      }
    });

    res.json(Object.values(grouped));

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

// ── GET MY OWN ACTIVE MOMENTS ──────────────────────────────────
router.get('/mine', auth, async (req, res) => {
  try {
    const moments = await Moment.find({
      author: req.user.userId
    }).sort({ createdAt: -1 });

    res.json(moments);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

// ── MARK A MOMENT AS VIEWED ─────────────────────────────────────
router.post('/:id/view', auth, async (req, res) => {
  try {
    await Moment.findByIdAndUpdate(req.params.id, {
      $addToSet: {
        viewedBy: req.user.userId
      }
    });

    res.json({
      message: 'Marked as viewed'
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

// ── DELETE MY OWN MOMENT EARLY ──────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const moment = await Moment.findById(req.params.id);

    if (!moment) {
      return res.status(404).json({
        message: 'Moment not found'
      });
    }

    if (moment.author.toString() !== req.user.userId) {
      return res.status(403).json({
        message: 'Not authorized'
      });
    }

    await moment.deleteOne();

    res.json({
      message: 'Moment deleted'
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;