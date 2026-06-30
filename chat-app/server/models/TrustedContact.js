// server/models/TrustedContact.js

const mongoose = require('mongoose');

const trustedContactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // whose emergency contact list this entry belongs to
  },
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // the trusted person — must be a registered LinKsy user for now,
    // since we're using your existing notification/socket system to alert them
  },
  label: {
    type: String,
    default: ''
    // optional — e.g. "Mom", "Roommate", "Best friend"
  }
}, { timestamps: true });

// A user can't add the same contact twice
trustedContactSchema.index({ user: 1, contact: 1 }, { unique: true });

module.exports = mongoose.model('TrustedContact', trustedContactSchema);