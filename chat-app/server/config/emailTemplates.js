// server/config/emailTemplates.js

const verificationTemplate = (username, verifyUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0E0E10;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#D4537E,#993556);padding:32px;text-align:center;">
      <div style="font-size:28px;font-weight:300;color:#F4C0D1;letter-spacing:1px;">
        lin<span style="font-weight:600;color:#fff;">K</span>sy
      </div>
      <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;">Connect. Share. Stay safe.</div>
    </div>

    <!-- Body -->
    <div style="padding:36px 32px;">
      <h2 style="color:#F1EFE8;font-size:22px;font-weight:600;margin:0 0 10px;">Verify your email ✨</h2>
      <p style="color:#B4B2A9;font-size:14px;line-height:1.7;margin:0 0 28px;">
        Hi <strong style="color:#ED93B1;">${username}</strong>,<br><br>
        Thanks for joining LinKsy! Click the button below to verify your email address and activate your account.
      </p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${verifyUrl}"
           style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#D4537E,#993556);color:#fff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;box-shadow:0 8px 24px rgba(212,83,126,0.4);">
          Verify my account
        </a>
      </div>

      <p style="color:#888780;font-size:12px;line-height:1.6;margin:0;">
        This link expires in <strong>24 hours</strong>. If you didn't create a LinKsy account, you can safely ignore this email.
      </p>

      <div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#888780;font-size:11px;margin:0;">
          Or copy this link into your browser:<br>
          <span style="color:#ED93B1;word-break:break-all;">${verifyUrl}</span>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

const otpTemplate = (username, otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0E0E10;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden;">

    <div style="background:linear-gradient(135deg,#D4537E,#993556);padding:32px;text-align:center;">
      <div style="font-size:28px;font-weight:300;color:#F4C0D1;letter-spacing:1px;">
        lin<span style="font-weight:600;color:#fff;">K</span>sy
      </div>
    </div>

    <div style="padding:36px 32px;">
      <h2 style="color:#F1EFE8;font-size:22px;font-weight:600;margin:0 0 10px;">Your login code 🔐</h2>
      <p style="color:#B4B2A9;font-size:14px;line-height:1.7;margin:0 0 28px;">
        Hi <strong style="color:#ED93B1;">${username}</strong>,<br><br>
        Use this code to complete your sign in. It expires in <strong style="color:#F1EFE8;">10 minutes</strong>.
      </p>

      <!-- OTP Code -->
      <div style="text-align:center;margin:32px 0;">
        <div style="display:inline-block;background:rgba(212,83,126,0.15);border:2px solid #D4537E;border-radius:16px;padding:20px 40px;">
          <div style="font-size:40px;font-weight:700;letter-spacing:12px;color:#ED93B1;">${otp}</div>
        </div>
      </div>

      <p style="color:#888780;font-size:12px;line-height:1.6;margin:0;text-align:center;">
        Never share this code with anyone.<br>
        LinKsy will never ask for it.
      </p>

      <div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);">
        <p style="color:#888780;font-size:11px;margin:0;">
          If you didn't try to log in, someone may have your password. Please change it immediately.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

module.exports = { verificationTemplate, otpTemplate };