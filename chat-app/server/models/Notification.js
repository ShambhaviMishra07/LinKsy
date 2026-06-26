// server/models/Notification.js

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // who should SEE this notification
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // who CAUSED this notification (the follower, the liker, etc.)
  },
  type: {
    type: String,
    enum: ['follow', 'follow_request', 'follow_accepted', 'message_request', 'like', 'comment'],
    required: true
    // we only use 'follow', 'follow_request', 'follow_accepted' for now
    // the rest are ready for when you build posts later
  },
  isRead: {
    type: Boolean,
    default: false
  },
  // Optional reference — e.g. which FollowRequest this notification is about
  refId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);