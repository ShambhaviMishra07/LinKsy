// server/config/email.js

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection on startup
transporter.verify((err, success) => {
  if (err) console.error('❌ Email error:', err.message);
  else console.log('✅ Email ready');
});

// ── Reusable send function ────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html
  });
};

module.exports = sendEmail;