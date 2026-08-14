
require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ==================== NEON POSTGRESQL ====================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then((client) => {
    console.log("Connected to Neon PostgreSQL");
    client.release();
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });


// ==================== REGISTER ====================

app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  try {

    // Check if email already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)`,
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: "User registered successfully"
    });

  } catch (error) {

    console.error("Registration error:", error);

    res.status(500).json({
      message: "Failed to register user"
    });
  }
});


// ==================== LOGIN ====================

app.post("/api/login", async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }

  try {

    // Find user
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    // User doesn't exist
    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }


    // =========================
    // GENERATE OTP
    // =========================

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );


    // Delete old OTP for this email
    await pool.query(
      "DELETE FROM otps WHERE email = $1",
      [email]
    );


    // Store OTP in Neon
    await pool.query(
      `INSERT INTO otps
       (email, otp, expires_at)
       VALUES ($1, $2, $3)`,
      [email, otp, expiresAt]
    );


    // Show OTP in backend console
    console.log(
      `OTP for ${email}: ${otp}`
    );


    // Tell frontend OTP is required
    res.json({
      message: "OTP generated. Please enter the OTP.",
      requiresOTP: true,
      otp: otp
    });

  } catch (error) {

    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error"
    });
  }
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

    // Get latest OTP
    const result = await pool.query(
      `SELECT *
       FROM otps
       WHERE email = $1
       ORDER BY id DESC
       LIMIT 1`,
      [email]
    );


    // OTP doesn't exist
    if (result.rows.length === 0) {

      return res.status(401).json({
        success: false,
        message: "OTP not found or expired"
      });
    }


    const storedOtp = result.rows[0];


    // =========================
    // CHECK EXPIRATION
    // =========================

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


    // =========================
    // CHECK OTP
    // =========================

    if (
      String(otp) !==
      String(storedOtp.otp)
    ) {

      return res.status(401).json({
        success: false,
        message: "Invalid OTP"
      });
    }


    // =========================
    // OTP CORRECT
    // =========================

    // Delete used OTP
    await pool.query(
      "DELETE FROM otps WHERE email = $1",
      [email]
    );


    // Get user information
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


    const user = userResult.rows[0];


    console.log(
      `OTP verified successfully for ${email}`
    );


    // Send user information to frontend
    res.json({
      success: true,
      message: "OTP verified successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
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
});


// ==================== START SERVER ====================

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);


// ==================== SERVER ERRORS ====================

server.on("close", () => {
  console.log("SERVER CLOSED");
});

server.on("error", (err) => {
  console.error(
    "SERVER ERROR:",
    err
  );
});
