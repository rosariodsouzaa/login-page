require("dotenv").config();

const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {

    // =================================
    // GET AUTHORIZATION HEADER
    // =================================

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required"
      });
    }

    // Expected format:
    // Bearer eyJhbGciOi...

    const parts = authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format"
      });
    }

    const token = parts[1];

    // =================================
    // VERIFY JWT
    // =================================

    try {

      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    } catch (error) {

      return res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });

    }

    // =================================
    // REVOKE SESSION
    // =================================

    const result = await pool.query(
      `UPDATE sessions
       SET revoked = TRUE
       WHERE token = $1
       AND revoked = FALSE
       RETURNING id`,
      [token]
    );

    // Session doesn't exist
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Session already logged out or not found"
      });
    }

    // =================================
    // LOGOUT SUCCESSFUL
    // =================================

    return res.status(200).json({
      success: true,
      message: "Logout successful"
    });

  } catch (error) {

    console.error(
      "Logout error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};