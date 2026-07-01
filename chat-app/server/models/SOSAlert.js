// server/models/SOSAlert.js

const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
   alertType: {
    type: String,
    enum: ['sos', 'location_share'],
    default: 'sos'
    // 'sos' = alarm-only emergency trigger
    // 'location_share' = live location streaming, no alarm
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'false_alarm'],
    default: 'active'
    // active = ongoing emergency, resolved = user marked themselves safe
  },
  // Location fields are ready for Phase 2 — null for now in Phase 1
  lastLocation: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    updatedAt: { type: Date, default: null }
  },
  notifiedContacts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
    // who actually got the alert — useful for confirming delivery
  }],
  resolvedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('SOSAlert', sosAlertSchema);