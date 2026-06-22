// server/routes/invite.routes.js
// ===== TEMP FEATURE: ROOM INVITE SYSTEM — DELETE THIS WHOLE FILE LATER =====
// Safe to delete this file entirely when moving to Instagram-style features
// Also remove its registration line in server.js (search for "TEMP FEATURE" there)

const express = require('express');
const router = express.Router();
const RoomInvite = require('../models/RoomInvite');
const Room = require('../models/Room');
const auth = require('../middleware/auth.middleware');

// ── SEND AN INVITE ──────────────────────────────────────────────
// POST /api/invites/:roomId/:targetUserId
// Anamika calls this to invite Liyaa to "justforfun"
router.post('/:roomId/:targetUserId', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // // Only existing members can invite others — basic check
    if (!room.members.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Only members can invite others' });
    }

    // Check if user is already a member
    if (room.members.includes(req.params.targetUserId)) {
      return res.status(400).json({ message: 'User is already in this room' });
    }

    // Check if an invite already exists
    const existing = await RoomInvite.findOne({
      room: req.params.roomId,
      invitedUser: req.params.targetUserId,
      status: 'pending'
    });
    if (existing) {
      return res.status(400).json({ message: 'Invite already sent' });
    }

    const invite = await RoomInvite.create({
      room: req.params.roomId,
      invitedBy: req.user.userId,
      invitedUser: req.params.targetUserId,
      status: 'pending'
    });

    res.status(201).json(invite);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET MY PENDING INVITES ──────────────────────────────────────
// GET /api/invites/pending
// Liyaa calls this to see "Anamika invited you to justforfun"
router.get('/pending', auth, async (req, res) => {
  try {
    const invites = await RoomInvite.find({
      invitedUser: req.user.userId,
      status: 'pending'
    })
      .populate('room', 'name description')
      .populate('invitedBy', 'username');

    res.json(invites);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ── ACCEPT AN INVITE ─────────────────────────────────────────────
// POST /api/invites/:inviteId/accept
router.post('/:inviteId/accept', auth, async (req, res) => {
  try {
    console.log("===== ACCEPT ROUTE HIT =====");

    const invite = await RoomInvite.findById(req.params.inviteId);

    console.log("Invite:", invite);

    if (!invite) {
      return res.status(404).json({
        message: 'Invite not found'
      });
    }

    // Prevent accepting twice
    if (invite.status !== 'pending') {
      return res.status(400).json({
        message: 'Invite already processed'
      });
    }

    // Only the invited user can accept
    if (invite.invitedUser.toString() !== req.user.userId) {
      return res.status(403).json({
        message: 'Not authorized'
      });
    }

 console.log("Invite object:");
console.log(invite);

console.log("invite.room =", invite.room);
console.log("typeof invite.room =", typeof invite.room);

const room = await Room.findById(invite.room);

console.log("room =", room);

    if (!room) {
      return res.status(404).json({
        message: 'Room not found'
      });
    }

    // Add user to members array
    room.members.push(req.user.userId);
    await room.save();

    // Mark invite accepted
    invite.status = 'accepted';
    await invite.save();

    res.json({
      message: 'Invite accepted',
      roomId: room._id
    });

  } catch (err) {
    console.log("ERROR INSIDE ACCEPT ROUTE:", err);

    res.status(500).json({
      message: err.message
    });
  }
});



// ── REJECT AN INVITE ─────────────────────────────────────────────
router.post('/:inviteId/reject', auth, async (req, res) => {
  try {
    const invite = await RoomInvite.findById(req.params.inviteId);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    if (invite.invitedUser.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    invite.status = 'rejected';
    await invite.save();

    res.json({ message: 'Invite rejected' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
// ===== END TEMP FEATURE =====