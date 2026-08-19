require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = async (req, res) => {

  // ==================== CORS ====================

  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://front-end-eight-sooty.vercel.app"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // Handle browser preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ==================== ONLY POST ====================

  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed",
    });
  }

  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  try {

    // Get OTP and temporary registration data
    const result = await pool.query(
      `SELECT *
       FROM otps
       WHERE email = $1
       ORDER BY id DESC
       LIMIT 1`,
      [email]
    );

    // OTP not found
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "OTP not found or expired",
      });
    }

    const storedOtp = result.rows[0];

    // Check expiration
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
        message: "OTP has expired",
      });
    }

    // Check OTP
    if (
      String(otp) !==
      String(storedOtp.otp)
    ) {

      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // OTP correct → create user
    const newUser = await pool.query(
      `INSERT INTO users
       (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [
        storedOtp.name,
        storedOtp.email,
        storedOtp.password,
      ]
    );

    // Delete used OTP
    await pool.query(
      "DELETE FROM otps WHERE email = $1",
      [email]
    );

    return res.status(200).json({
      success: true,
      message: "Registration successful",
      user: newUser.rows[0],
    });

  } catch (error) {

    console.error(
      "OTP verification error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};