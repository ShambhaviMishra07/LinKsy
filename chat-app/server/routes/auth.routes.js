// server/routes/auth.routes.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // built into Node — no install needed
const User = require('../models/User');
const redis = require('../config/redis');
const sendEmail = require('../config/email');
const { verificationTemplate, otpTemplate } = require('../config/emailTemplates');
const auth = require('../middleware/auth.middleware');

// ── REGISTER ──────────────────────────────────────────────────


router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Check if email exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });

    if (existingEmail) {
      if (existingEmail.isVerified) {
        // Fully registered — block
        return res.status(400).json({ message: 'Email already in use' });
      } else {
        // Unverified — update their token and resend
        // This handles the "I clicked register again" case
        existingEmail.verificationToken = verificationToken;
        existingEmail.verificationExpires = verificationExpires;
        existingEmail.password = hashedPassword; // update in case they changed it
        await existingEmail.save();

        const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
        await sendEmail({
          to: existingEmail.email,
          subject: 'Verify your LinKsy account',
          html: verificationTemplate(existingEmail.username, verifyUrl)
        });

        return res.status(201).json({
          message: 'Verification email resent. Please check your inbox.',
          email: existingEmail.email
        });
      }
    }

    // Check username separately
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Create new user
    const user = await User.create({
      firstName: firstName || '',
      lastName: lastName || '',
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      isVerified: false,
      verificationToken,
      verificationExpires
    });

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your LinKsy account',
      html: verificationTemplate(user.username, verifyUrl)
    });

    res.status(201).json({
      message: 'Account created. Please check your email to verify.',
      email: user.email
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: err.message });
  }
});
// ── VERIFY EMAIL ──────────────────────────────────────────────
// GET /api/auth/verify-email?token=abc123
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Verification token missing' });
    }

    const user = await User.findOne({
      verificationToken: token,
      // verificationExpires: { $gt: new Date() } // token hasn't expired
    });

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired verification link. Please register again.'
      });
    }
     if (user.isVerified) {
      return res.status(400).json({ message: 'already_verified' });
    }

    // Mark as verified, clear the token
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationExpires = null;
    await user.save();
   
      res.json({ message: 'verified' });


  } catch (err) {
     console.error('Verify email error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── RESEND VERIFICATION EMAIL ─────────────────────────────────
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'No account with that email' });
    if (user.isVerified) return res.status(400).json({ message: 'Account already verified' });

    // Generate fresh token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Verify your LinKsy account',
      html: verificationTemplate(user.username, verifyUrl)
    });

    res.json({ message: 'Verification email resent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── LOGIN — step 1: check credentials, send OTP ───────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        needsVerification: true,
        email: user.email
      });
    }

    // ── 2FA: generate 6-digit OTP ─────────────────────────────
    // crypto.randomInt gives a cryptographically secure random number
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store in Redis with 10-minute expiry
    // Key: otp:{userId} = the OTP string
    await redis.set(`otp:${user._id}`, otp, 'EX', 600);

    // Send OTP email
    await sendEmail({
      to: user.email,
      subject: 'Your LinKsy login code',
      html: otpTemplate(user.username, otp)
    });

    // Don't send JWT yet — user still needs to verify OTP
    res.json({
      message: 'OTP sent to your email',
      requires2FA: true,
      userId: user._id,
      // Send back limited info for the OTP screen
      user: { email: user.email, username: user.username }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── LOGIN — step 2: verify OTP, issue JWT ────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // Get stored OTP from Redis
    const storedOtp = await redis.get(`otp:${userId}`);

    if (!storedOtp) {
      return res.status(400).json({
        message: 'OTP expired. Please log in again.'
      });
    }

    if (storedOtp !== otp.toString()) {
      return res.status(400).json({ message: 'Incorrect code. Please try again.' });
    }

    // OTP correct — delete it so it can't be reused
    await redis.del(`otp:${userId}`);

    const user = await User.findById(userId).select('-password -verificationToken');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // NOW issue the JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── RESEND OTP ────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).select('email username isVerified');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.isVerified) return res.status(403).json({ message: 'Email not verified' });

    const otp = crypto.randomInt(100000, 999999).toString();
    await redis.set(`otp:${userId}`, otp, 'EX', 600);

    await sendEmail({
      to: user.email,
      subject: 'Your new LinKsy login code',
      html: otpTemplate(user.username, otp)
    });

    res.json({ message: 'New OTP sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;