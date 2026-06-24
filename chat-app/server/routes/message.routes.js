const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const redis = require('../config/redis');
const auth = require('../middleware/auth.middleware');

// const Room = require('../models/Room');


//GET /api/messages/:roomId - load message history for a room
router.get('/:roomId', auth, async (req, res) => {
    try{



    //     // ── VERIFY MEMBERSHIP ─────────────────────────────────────
    // const room = await Room.findById(req.params.roomId);
    // if (!room) return res.status(404).json({ message: 'Room not found' });

    // const isMember = room.members.some(
    //   memberId => memberId.toString() === req.user.userId
    // );

    // if (!isMember) {
    //   return res.status(403).json({ message: 'You are not a member of this room' });
    // }





        const cacheKey = `room:message:${req.params.roomId }`;

        //-----------CHECK REDIS FIRST-----------------------
        //LRANGE key 0 49 = get all items from index 0 to 49
        const cached = await redis.lrange(cacheKey, 0, 49);

        if(cached.length > 0){
            //parse each JSON string back into object
            //reverse because LPUSH stores newest-first, we want oldest-first
            const message = cached.map(m => JSON.parse(m)).reverse();
            console.log(`Served ${messages.length} messages from Redis cache`);
            return res.json({source: 'cache', messages});
        }

        // -----------CACHE MISS - HIT MONGODB---------------
        //This only runs when redis has no data(first load, or cache expired)
        const messages= await Message.find({room : req.params.roomId})
        .populate('sender', 'username avatar')
        .sort({createdAt: 1})
        .limit(50);
    
    console.log(`🗄️ Served ${messages.length} messages from MongoDB`);
    res.json({ source: 'db', messages });

  } catch (err) {
    console.error('History error:', err.message);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

//POST /api/message/:roomId/seen - mark all messages as read
// called when a user opens a room and reads the messages
router.post('/:roomId/seen', auth, async (req, res) => {
  try{
    //update all messages in this room that:
    //1. were not sent by the current user (no point marking own messages)
    //2. don't already have current user in seenBy
    await Message.updateMany({
      room: req.params.roomId,
      sender: { $ne : req.user.userId},  //$ne = not equal
      seenBy: {$nin: [req.user.userId ]}  //$nin = not in array
  }, 
  {
    $addToSet:{ seenBy: req.user.userId} // add to seenby array
  }
);
res.json({ message : 'Marked as seen'});
} catch (err) {
  res.status(500).json({message: err.message});
}
});
module.exports = router;