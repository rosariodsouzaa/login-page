// =========================
// GENERATE OTP
// =========================

const otp = Math.floor(100000 + Math.random() * 900000).toString();

const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

// Remove any previous OTP for this email
await pool.query(
  "DELETE FROM otps WHERE email = $1",
  [email]
);

// Store new OTP in Neon
await pool.query(
  `INSERT INTO otps (email, otp, expires_at)
   VALUES ($1, $2, $3)`,
  [email, otp, expiresAt]
);

// Show OTP in backend console
console.log(`OTP for ${email}: ${otp}`);

res.json({
  message: "OTP generated. Please enter the OTP.",
  requiresOTP: true,
  otp: otp
});

// ==================== VERIFY OTP ====================

app.post("/api/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required"
    });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM otps
       WHERE email = $1
       ORDER BY id DESC
       LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "OTP not found or expired"
      });
    }

    const storedOtp = result.rows[0];

    // Check expiry
    if (new Date() > new Date(storedOtp.expires_at)) {
      await pool.query(
        "DELETE FROM otps WHERE email = $1",
        [email]
      );

      return res.status(401).json({
        success: false,
        message: "OTP has expired"
      });
    }

    // Check OTP
    if (String(otp) !== String(storedOtp.otp)) {
      return res.status(401).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // OTP correct → delete it
    await pool.query(
      "DELETE FROM otps WHERE email = $1",
      [email]
    );

    // Get user
    const userResult = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log(`OTP verified successfully for ${email}`);

    res.json({
      success: true,
      message: "OTP verified successfully",
      user: userResult.rows[0]
    });

  } catch (error) {
    console.error("OTP verification error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});