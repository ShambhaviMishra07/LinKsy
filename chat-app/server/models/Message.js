// server/models/Message.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  room: {
    type: String,
    ref: 'Room',
    required: true
    // Now references a real Room document instead of a plain string
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
    // For image messages, content stores the Cloudinary URL
    // For text messages, content stores the text
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  seenBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // Array of userIds who have read this message
    // Empty = nobody read it yet (except sender)
    // [userId1] = one person read it
  }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);