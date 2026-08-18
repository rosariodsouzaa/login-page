// =========================
// GENERATE OTP
// =========================

const otp = Math.floor(
  100000 + Math.random() * 900000
).toString();

const expiresAt = new Date(
  Date.now() + 5 * 60 * 1000
);

const hashedPassword = await bcrypt.hash(
  password,
  10
);

await pool.query(
  "DELETE FROM otps WHERE email = $1",
  [email]
);

await pool.query(
  `INSERT INTO otps
   (email, otp, expires_at, name, password)
   VALUES ($1, $2, $3, $4, $5)`,
  [
    email,
    otp,
    expiresAt,
    name,
    hashedPassword
  ]
);

console.log(
  `Registration OTP for ${email}: ${otp}`
);

res.json({
  message: "OTP generated. Please enter the OTP.",
  requiresOTP: true
});

// ==================== VERIFY OTP ====================
app.post(
  "/api/verify-registration-otp",
  async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required"
      });
    }

    try {
      const result = await pool.query(
        `SELECT *
         FROM otps
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

      if (
        new Date() >
        new Date(storedOtp.expires_at)
      ) {
        await pool.query(
          "DELETE FROM otps WHERE email = $1",
          [email]
        );

        return res.status(401).json({
          success: false,
          message: "OTP has expired"
        });
      }

      if (
        String(otp) !==
        String(storedOtp.otp)
      ) {
        return res.status(401).json({
          success: false,
          message: "Invalid OTP"
        });
      }

      const newUser = await pool.query(
        `INSERT INTO users
         (name, email, password)
         VALUES ($1, $2, $3)
         RETURNING id, name, email`,
        [
          storedOtp.name,
          storedOtp.email,
          storedOtp.password
        ]
      );

      await pool.query(
        "DELETE FROM otps WHERE email = $1",
        [email]
      );

      res.json({
        success: true,
        message: "Registration successful",
        user: newUser.rows[0]
      });

    } catch (error) {
      console.error(
        "OTP verification error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }
);