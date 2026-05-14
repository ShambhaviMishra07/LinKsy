const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const redis = require('../config/redis');
const auth = require('../middleware/auth.middleware');

//GET /api/messages/:roomId - load message history for a room
router.get('/:roomId', auth, async (req, res) => {
    try{
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

module.exports = router;