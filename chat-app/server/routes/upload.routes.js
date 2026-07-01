const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const { upload, uploadToCloudinary } = require('../config/cloudinary');

// POST /api/upload
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded'
      });
    }

    // Detect whether the uploaded file is an image or video
    const isVideo = req.file.mimetype.startsWith('video');

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      'linksy/chat',
      isVideo ? 'video' : 'image'
    );

    res.json({
      url: result.secure_url,
      publicId: result.public_id
    });

  } catch (err) {
    console.error('========== UPLOAD ERROR ==========');
    console.error(err);
    console.error('Message:', err.message);
    console.error('Stack:', err.stack);

    res.status(500).json({
      message: err.message
    });
  }
});

module.exports = router;