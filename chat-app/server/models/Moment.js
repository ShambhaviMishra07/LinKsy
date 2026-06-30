// server/models/Moment.js

const mongoose = require('mongoose');

const momentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mediaUrl: {
    type: String,
    required: true
    // Cloudinary URL — image or short video
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  caption: {
    type: String,
    default: '',
    maxlength: 200
  },
  viewedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // who has seen this Moment — powers the seen/unseen ring
  }],
  expiresAt: {
    type: Date,
    required: true
    // set to createdAt + 24 hours at creation time
  }
}, { timestamps: true });

// ── TTL INDEX — the key mechanic ──────────────────────────────
// MongoDB runs a background task roughly every 60 seconds that checks
// this field. Once expiresAt is in the past, the document is deleted
// automatically. expireAfterSeconds: 0 means "delete exactly at expiresAt,
// don't wait any extra time after that."
momentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Moment', momentSchema);