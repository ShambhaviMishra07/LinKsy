// server/models/Follow.js

const mongoose = require('mongoose');

// Represents an ACCEPTED follow relationship — a real edge in the graph
// "follower follows following"
const followSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // the person who is doing the following
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // the person being followed
  }
}, { timestamps: true });

// Prevent duplicate follow relationships
// A user can't follow the same person twice
followSchema.index({ follower: 1, following: 1 }, { unique: true });

module.exports = mongoose.model('Follow', followSchema);