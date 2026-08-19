const { Pool } = require("pg");
const bcrypt = require("bcrypt");

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

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    // Generate OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP expires in 5 minutes
    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Delete old OTP
    await pool.query(
      "DELETE FROM otps WHERE email = $1",
      [email]
    );

    // Store registration details temporarily
    await pool.query(
      `INSERT INTO otps
       (email, otp, expires_at, name, password)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        email,
        otp,
        expiresAt,
        name,
        hashedPassword,
      ]
    );

    console.log(
      `Registration OTP for ${email}: ${otp}`
    );

    return res.status(200).json({
      message: "OTP generated. Please enter the OTP.",
      requiresOTP: true,

      // TEMPORARY: only for testing
      otp: otp,
    });

  } catch (error) {

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed",
    });
  }
};