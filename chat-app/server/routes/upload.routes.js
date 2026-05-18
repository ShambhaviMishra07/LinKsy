const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const {upload} = require('../config/cloudinary');

//POST /api/upload
// upload.single('image') = multer processes one file from the image field
//after this middleware runs. req.file contains cloudinary response

router.post('/', auth, upload.single('image'), (req, res) => {
    try{
        if(!req.file){
            return res.status(400).json({message: "no file uploaded"});
        }

        //req.file.path = the cloudinary URL of the uploaded image
        //this is what we store as the message content
    }
})