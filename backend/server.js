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

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    // Generate OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // Hash password before temporarily storing it
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Delete any old OTP for this email
    await pool.query(
      "DELETE FROM otps WHERE email = $1",
      [email]
    );

    // Store registration data temporarily with OTP
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

    // Show OTP in backend console
    console.log(
      `Registration OTP for ${email}: ${otp}`
    );

    return res.status(200).json({
      requiresOTP: true,
      message: "OTP generated. Please enter the OTP.",
      otp:otp
    });

  } catch (error) {

    console.error(
      "Registration error:",
      error
    );

    res.status(500).json({
      message: "Failed to start registration"
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

    // Find registered user
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const user = result.rows[0];

    // Compare entered password with hashed password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Login successful directly
    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {

    console.error(
      "Login error:",
      error
    );

    res.status(500).json({
      message: "Server error"
    });
  }
});


// ==================== VERIFY REGISTRATION OTP ====================

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

      // Get OTP and temporary registration data
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
          message: "OTP not found"
        });
      }

      const storedOtp = result.rows[0];

      // Check OTP expiration
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

      // Check OTP
      if (
        String(otp) !==
        String(storedOtp.otp)
      ) {

        return res.status(401).json({
          success: false,
          message: "Invalid OTP"
        });
      }

      // Create user only after OTP verification
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

      // Delete used OTP and temporary data
      await pool.query(
        "DELETE FROM otps WHERE email = $1",
        [email]
      );

      const user = newUser.rows[0];

      console.log(
        `Registration completed for ${email}`
      );

      return res.json({
        success: true,
        message: "Registration successful",
        user
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