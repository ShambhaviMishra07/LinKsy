// server/routes/sos.routes.js

const express = require('express');
const router = express.Router();
const TrustedContact = require('../models/TrustedContact');
const SOSAlert = require('../models/SOSAlert');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth.middleware');
const emitNotification = require('../utils/notifyUser');


// ── ADD A TRUSTED CONTACT ────────────────────────────────────────
router.post('/contacts/:userId', auth, async (req, res) => {
  try {
    if (req.user.userId === req.params.userId) {
      return res.status(400).json({ message: "You can't add yourself" });
    }

    const existing = await TrustedContact.findOne({
      user: req.user.userId,
      contact: req.params.userId
    });
    if (existing) {
      return res.status(400).json({ message: 'Already a trusted contact' });
    }

    const contact = await TrustedContact.create({
      user: req.user.userId,
      contact: req.params.userId,
      label: req.body?.label || ''
    });

    await contact.populate('contact', 'username avatar');
    res.status(201).json(contact);
  } catch (err) {
     console.error('Add contact error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ── GET MY TRUSTED CONTACTS ──────────────────────────────────────
router.get('/contacts', auth, async (req, res) => {
  try {
    const contacts = await TrustedContact.find({ user: req.user.userId })
      .populate('contact', 'username avatar');
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── REMOVE A TRUSTED CONTACT ─────────────────────────────────────
router.delete('/contacts/:contactDocId', auth, async (req, res) => {
  try {
    const result = await TrustedContact.findOneAndDelete({
      _id: req.params.contactDocId,
      user: req.user.userId // security: can only delete your own entries
    });
    if (!result) return res.status(404).json({ message: 'Contact not found' });
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── TRIGGER SOS ──────────────────────────────────────────────────
// This is the big one — fires when the SOS button is pressed
router.post('/trigger', auth, async (req, res) => {
  try {
    // Get all trusted contacts for this user
    const contacts = await TrustedContact.find({
      user: req.user.userId
    });

    if (contacts.length === 0) {
      return res.status(400).json({
        message: 'Add at least one trusted contact before using SOS'
      });
    }

    // Create the SOS alert record
    const alert = await SOSAlert.create({
      triggeredBy: req.user.userId,
      alertType: 'sos',
      status: 'active',
      notifiedContacts: contacts.map(c => c.contact)
    });

    // Notify every trusted contact via your existing Notification system
   
    const io = req.app.get('io');

for (const c of contacts) {
  const notif = await Notification.create({
    recipient: c.contact,
    sender: req.user.userId,
    type: 'sos',
    refId: alert._id
  });

  await notif.populate('sender', 'username avatar');

  emitNotification(io, c.contact.toString(), notif);
}

    // Emit socket event immediately
    // const io = req.app.get('io');

    if (io) {
      const User = require('../models/User');

      const sender = await User.findById(req.user.userId)
        .select('username');

      contacts.forEach(c => {
        io.to(`user:${c.contact}`).emit('sos_alert_triggered', {
          alertId: alert._id,
          from: sender.username
        });
      });
    }

    res.status(201).json({
      alertId: alert._id,
      notifiedCount: contacts.length
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
});

// Add to server/routes/sos.routes.js

// GET /api/sos/active/:alertId — fetch alert details, including who triggered it
router.get('/active/:alertId', auth, async (req, res) => {
  try {
    const alert = await SOSAlert.findById(req.params.alertId)
      .populate('triggeredBy', 'username avatar');

    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ── RESOLVE / CANCEL SOS (mark yourself safe) ────────────────────
router.post('/resolve/:alertId', auth, async (req, res) => {
  try {
    const alert = await SOSAlert.findById(req.params.alertId);
    if (!alert) return res.status(404).json({ message: 'Alert not found' });

    if (alert.triggeredBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    await alert.save();

    res.json({ message: 'Marked as safe' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// server/routes/sos.routes.js — update /share-location route

router.post('/share-location', auth, async (req, res) => {
  try {
    const contacts = await TrustedContact.find({ user: req.user.userId });

    if (contacts.length === 0) {
      return res.status(400).json({
        message: 'Add at least one trusted contact before sharing location'
      });
    }

    const alert = await SOSAlert.create({
      triggeredBy: req.user.userId,
      alertType: 'location_share',
      status: 'active',
      notifiedContacts: contacts.map(c => c.contact)
    });

    // const notificationPromises = contacts.map(c =>
    //   Notification.create({
    //     recipient: c.contact,
    //     sender: req.user.userId,
    //     type: 'location_share',
    //     refId: alert._id
    //   })
    // );
    // await Promise.all(notificationPromises);
    const io = req.app.get('io');

for (const c of contacts) {
  const notif = await Notification.create({
    recipient: c.contact,
    sender: req.user.userId,
    type: 'location_share',
    refId: alert._id
  });

  await notif.populate('sender', 'username avatar');

  emitNotification(io, c.contact.toString(), notif);
}

    // ── Emit directly to each contact's personal socket room ──
    // This fires IMMEDIATELY — no waiting for GPS updates
    // const io = req.app.get('io');
    console.log('io instance exists:', !!io);        // should print: true
    console.log('Notifying contacts:', contacts.length);


    if (io) {
      const sender = await require('../models/User')
        .findById(req.user.userId)
        .select('username');

      contacts.forEach(c => {



          const room = `user:${c.contact}`;
    console.log('Emitting to room:', room);  




        io.to(room).emit('sos_location_share_started', {
          alertId: alert._id,
          from: sender.username
        });
      });
    }

    res.status(201).json({ alertId: alert._id, notifiedCount: contacts.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;