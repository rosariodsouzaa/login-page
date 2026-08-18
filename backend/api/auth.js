require("dotenv").config();

const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const authenticateToken = async (req, res) => {
  try {

    // Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: "Authorization token is required"
      });

      return false;
    }

    // Expected:
    // Bearer TOKEN

    const parts = authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer"
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid authorization format"
      });

      return false;
    }

    const token = parts[1];

    // Verify JWT
    let decoded;

    try {

      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    } catch (error) {

      res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });

      return false;
    }

    // Check session in database
    const result = await pool.query(
      `SELECT *
       FROM sessions
       WHERE token = $1
       AND revoked = FALSE
       AND expires_at > NOW()
       LIMIT 1`,
      [token]
    );

    // Session doesn't exist or was revoked
    if (result.rows.length === 0) {

      res.status(401).json({
        success: false,
        message: "Session expired or logged out"
      });

      return false;
    }

    // Attach user information
    req.user = decoded;

    return true;

  } catch (error) {

    console.error(
      "Authentication error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Authentication server error"
    });

    return false;
  }
};

module.exports = authenticateToken;