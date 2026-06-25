// server/models/Room.js

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPrivate: {
    type: Boolean,
    default: false
    // true = DM between two users
    // false = public group room anyone can join
  },
  lastMessage: {
    // We store a preview of the last message
    // This powers the sidebar — shows latest message under room name
    // Just like WhatsApp sidebar
    content: String,
    sender: String,
    createdAt: Date
  },
  // In Room schema, add:
isMessageRequest: {
  type: Boolean,
  default: false
},
requestedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null
}
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);