// server/models/FollowRequest.js

const mongoose = require('mongoose');

// Represents a PENDING request — not yet a real relationship
const followRequestSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // who sent the follow request
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // who is being asked to follow
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

followRequestSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model('FollowRequest', followRequestSchema);