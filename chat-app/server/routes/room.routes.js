// server/routes/room.routes.js

const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const auth = require('../middleware/auth.middleware');
const Follow = require('../models/Follow');

// ── GET ALL PUBLIC ROOMS ───────────────────────────────────────
// Called when user opens the app — loads the room list in sidebar
// router.get('/', auth, async (req, res) => {
//   try {
//     const rooms = await Room.find({ isPrivate: false })
//       .populate('createdBy', 'username')
//       .populate('members', 'username')
//       .sort({ updatedAt: -1 }); // most recently active first

//     res.json(rooms);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { isPrivate: false },                    // all public rooms
        { isPrivate: true, members: req.user.userId } // DMs you're part of
      ]
    })
      .populate('members', 'username avatar')   // ← populate members with username
      .populate('createdBy', 'username')
      .sort({ updatedAt: -1 });

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── CREATE A NEW ROOM ──────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    // Check if room with this name already exists
    const existing = await Room.findOne({ name, isPrivate: false });
    if (existing) {
      return res.status(400).json({ message: 'Room name already taken' });
    }

    const room = await Room.create({
      name,
      description,
      createdBy: req.user.userId,
      members: [req.user.userId] // creator is automatically a member
    });

    await room.populate('createdBy', 'username');

    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── JOIN A ROOM ────────────────────────────────────────────────
router.post('/:roomId/join', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // $addToSet = add to array only if not already there
    // Prevents duplicate member entries
    await Room.findByIdAndUpdate(req.params.roomId, {
      $addToSet: { members: req.user.userId }
    });

    res.json({ message: 'Joined successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── CREATE OR GET EXISTING DM ──────────────────────────────────
// When User A wants to DM User B, call this first
// If DM room exists between them → return it
// If not → create a new private room

router.post('/dm/:targetUserId', auth, async (req, res) => {
  try {
    const myId = req.user.userId;
    const theirId = req.params.targetUserId;

    const existingDM = await Room.findOne({
      isPrivate: true,
      members: { $all: [myId, theirId], $size: 2 }
    });

    if (existingDM) {
      return res.json(existingDM);
    }

    // Check mutual follow status
    const iFollowThem = await Follow.exists({
      follower: myId,
      following: theirId
    });

    const theyFollowMe = await Follow.exists({
      follower: theirId,
      following: myId
    });

    const isMutual = !!iFollowThem && !!theyFollowMe;

    const dm = await Room.create({
      name: `dm-${myId}-${theirId}`,
      isPrivate: true,
      createdBy: myId,
      members: [myId, theirId],

      isMessageRequest: !isMutual,
      requestedBy: !isMutual ? myId : null
    });

    res.status(201).json(dm);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ACCEPT A MESSAGE REQUEST
router.post('/:roomId/accept-request', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.members.includes(req.user.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    room.isMessageRequest = false;
    room.requestedBy = null;

    await room.save();

    res.json({ message: 'Message request accepted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET MY PENDING MESSAGE REQUESTS
router.get('/requests/pending', auth, async (req, res) => {
  try {
    const requests = await Room.find({
      isPrivate: true,
      isMessageRequest: true,
      members: req.user.userId,
      requestedBy: { $ne: req.user.userId }
    }).populate('members', 'username avatar');

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;