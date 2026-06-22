// server/models/RoomInvite.js
// ===== TEMP FEATURE: ROOM INVITE SYSTEM — DELETE THIS WHOLE FILE LATER =====
// This entire file is part of the temporary "invite to room" feature
// Safe to delete this file entirely when moving to Instagram-style features

const mongoose = require('mongoose');

const roomInviteSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

// Prevent duplicate invites to the same person for the same room
roomInviteSchema.index({ room: 1, invitedUser: 1 }, { unique: true });

module.exports = mongoose.model('RoomInvite', roomInviteSchema);
// ===== END TEMP FEATURE =====