// server/routes/follow.routes.js

const express = require('express');
const router = express.Router();
const Follow = require('../models/Follow');
const FollowRequest = require('../models/FollowRequest');
const User = require('../models/User');
const auth = require('../middleware/auth.middleware');
const Notification = require('../models/Notification');
const emitNotification = require('../utils/notifyUser');



// ── SEND A FOLLOW REQUEST ──────────────────────────────────────
// POST /api/follow/:targetUserId
router.post('/:targetUserId', auth, async (req, res) => {
  try {
    const myId = req.user.userId;
    const targetId = req.params.targetUserId;

    if (myId === targetId) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    // Check if already following
    const alreadyFollowing = await Follow.findOne({ follower: myId, following: targetId });
    if (alreadyFollowing) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Check if a request already exists
    const existingRequest = await FollowRequest.findOne({ from: myId, to: targetId });
    if (existingRequest) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // ── KEY LOGIC ─────────────────────────────────────────────
    // If target account is PUBLIC, auto-accept — create Follow immediately
    // If target account is PRIVATE, create a pending FollowRequest instead
    if (!targetUser.isPrivate) {
  const follow = await Follow.create({
    follower: myId,
    following: targetId
  });

  // Notify user that someone followed them
const io = req.app.get('io');

const notif = await Notification.create({
  recipient: targetId,
  sender: myId,
  type: 'follow'
});

await notif.populate('sender', 'username avatar');

emitNotification(io, targetId, notif);

  return res.status(201).json({
    status: 'accepted',
    follow
  });
}



// const notif = await Notification.create({
//   recipient: targetId,
//   sender: myId,
//   type: 'follow'
// });

// await notif.populate('sender', 'username avatar');

// emitNotification(io, targetId, notif);

// return res.status(201).json({
//   status: 'accepted',
//   follow
// });

// }
const request = await FollowRequest.create({
  from: myId,
  to: targetId,
  status: 'pending'
});

// Notify user that someone requested to follow them
const io = req.app.get('io');

const notif = await Notification.create({
  recipient: targetId,
  sender: myId,
  type: 'follow_request',
  refId: request._id
});

await notif.populate('sender', 'username avatar');

emitNotification(io, targetId, notif);

res.status(201).json({
  status: 'pending',
  request
});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET MY INCOMING FOLLOW REQUESTS ────────────────────────────
// GET /api/follow/requests
router.get('/requests', auth, async (req, res) => {
  try {
    const requests = await FollowRequest.find({
      to: req.user.userId,
      status: 'pending'
    }).populate('from', 'username avatar bio');

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── ACCEPT A FOLLOW REQUEST ─────────────────────────────────────
// POST /api/follow/requests/:requestId/accept
router.post('/requests/:requestId/accept', auth, async (req, res) => {
  try {
    const request = await FollowRequest.findById(req.params.requestId);

    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Security check: only the recipient can accept their own request
    if (request.to.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create the real Follow relationship
      await Follow.create({
      follower: request.from,
      following: request.to
    });

    request.status = 'accepted';
    await request.save();

    // Notify the requester that their follow request was accepted
    const io = req.app.get('io');

    const notif = await Notification.create({
      recipient: request.from,
      sender: request.to,
      type: 'follow_accepted'
    });

    await notif.populate('sender', 'username avatar');

    emitNotification(io, request.from, notif);

    res.json({
      message: 'Follow request accepted'
    });

      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

// ── REJECT A FOLLOW REQUEST ─────────────────────────────────────
router.post('/requests/:requestId/reject', auth, async (req, res) => {
  try {
    const request = await FollowRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.to.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Follow request rejected' });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── CHECK RELATIONSHIP STATUS BETWEEN TWO USERS ─────────────────
// GET /api/follow/status/:targetUserId
// Returns: iFollow, followsMe, isMutual, pendingRequest
router.get('/status/:targetUserId', auth, async (req, res) => {
  try {
    const myId = req.user.userId;
    const targetId = req.params.targetUserId;

    const iFollow = await Follow.exists({ follower: myId, following: targetId });
    const followsMe = await Follow.exists({ follower: targetId, following: myId });
    const pendingRequest = await FollowRequest.exists({
      from: myId, to: targetId, status: 'pending'
    });

    res.json({
      iFollow: !!iFollow,
      followsMe: !!followsMe,
      isMutual: !!iFollow && !!followsMe,
      pendingRequest: !!pendingRequest
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET FOLLOWERS / FOLLOWING LISTS ──────────────────────────────
router.get('/:userId/followers', auth, async (req, res) => {
  try {
    const followers = await Follow.find({ following: req.params.userId })
      .populate('follower', 'username avatar bio');
    res.json(followers.map(f => f.follower));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:userId/following', auth, async (req, res) => {
  try {
    const following = await Follow.find({ follower: req.params.userId })
      .populate('following', 'username avatar bio');
    res.json(following.map(f => f.following));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// ── UNFOLLOW A USER ──────────────────────────────────────────────
// DELETE /api/follow/:targetUserId
router.delete('/:targetUserId', auth, async (req, res) => {
  try {
    const result = await Follow.findOneAndDelete({
      follower: req.user.userId,
      following: req.params.targetUserId
    });

    if (!result) {
      return res.status(404).json({ message: 'You are not following this user' });
    }

    res.json({ message: 'Unfollowed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── CANCEL A PENDING FOLLOW REQUEST ─────────────────────────────
// DELETE /api/follow/requests/:targetUserId/cancel
// Used when you sent a request to a private account and want to take it back
router.delete('/requests/:targetUserId/cancel', auth, async (req, res) => {
  try {
    const result = await FollowRequest.findOneAndDelete({
      from: req.user.userId,
      to: req.params.targetUserId,
      status: 'pending'
    });

    if (!result) {
      return res.status(404).json({ message: 'No pending request found' });
    }

    res.json({ message: 'Request cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;