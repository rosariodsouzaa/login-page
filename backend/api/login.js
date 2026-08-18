require("dotenv").config();

const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // NEW

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {

  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed"
    });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required"
    });
  }

  try {

    // Find user using email
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    // User does not exist
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

    // =================================
    // CREATE JWT
    // =================================

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h"
      }
    );

    // =================================
    // CREATE SESSION
    // =================================

    const expiresAt = new Date(
      Date.now() + 60 * 60 * 1000
    );

    await pool.query(
      `INSERT INTO sessions
       (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [
        user.id,
        token,
        expiresAt
      ]
    );

    // =================================
    // LOGIN SUCCESSFUL
    // =================================

    return res.status(200).json({
      success: true,
      message: "Login successful",

      // Send JWT to frontend
      token: token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {

    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};