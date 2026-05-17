const cloudinary = require('cloudinary').v2;
const { cloudinaryStorage, CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

//configure cloudinary with your account credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//CloudinaryStorgae tells multer where to send the file
//instead of saving to disk, it strams directly to cloudinary
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'linksy-chat', 
        allowed_formats: ['jpg','jpeg','png','gif','webp'],
        transformation: [{width:1000, crop: 'limit'}]
    }
});

//upload is a multer middleware -use it in routes like:
//router.post('/upload', upload.single('image'), handler)

const upload = multer({ storage });
module.exports = {upload, cloudinary};