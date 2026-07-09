const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = require('../middleware/auth.middleware');
//REGISTER
router.post('/register', async (req, res) =>{
    try{
        const{username, email, password } = req.body;

        //1. check if user already exists
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message: 'email already in use'});
        }
       //2. hash the password before saving using bcrypt.hash(password, saltRounds)
       //saltRounds = 10 means it runs the hashing algo 2^10 =1024 times
       //if more rounds are allowed then its harder to crack but slower so 10 is preferrable.

       const hashedPassword = await bcrypt.hash(password, 10);

       //3. save user to database
       const user = await User.create({
         firstName: req.body.firstName || '',
        lastName: req.body.lastName || '',
        username,
        email,
        password: hashedPassword
       });

      //4. create JWT token{jwt.sign(payload, secret, options)}
      //payload = data you want to store inside the token
      //secret = you JWT_SECRET from .env
      //expiresIn = token expired after 7 dats, user must login again

      const token = jwt.sign(
        {userId: user._id, username: user.username},
        process.env.JWT_SECRET,
        {expiresIn: '7d'}
      );

      res.status(201).json({
        token,
        user: {id: user._id, username: user.username, email: user.email}
      });
    } catch (err){
        res.status(500).json({ message: 'Server error', error: err.message});
    }
});


// ---------------LOGIN------------------
router.post('/login', async (req, res) => {
    try{
        const{email, password} = req.body;

    //1. find the user
    const user = await User.findOne({email});
    if(!user){
        return res.status(400).json({message: "Invalid Credentials"});
    }
    //2. compare entered password with the hashed one stored in database
    //bcrypt.compare handle the hashing internally so you never see the raw hashing

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        return res.status(400).json({message: 'Invalid credentials'});
    }

    //3. create and send JWT- same as register
    const token = jwt.sign({
        userId: user._id, username: user.username
    }, 
    process.env.JWT_SECRET,
    {expiresIn: '7d'}
);
res.json({
    token,
    user: {id: user._id, username: user.username, email: user.email}
});
    } catch (err){
        res.status(500).json({message: 'server error', error: err.message});
    }
});





module.exports = router;