require("dotenv").config();

const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const authenticateToken = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;

    // No token
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    // Check Bearer format
    const parts = authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
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
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
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

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Session expired or logged out",
      });
    }

    // Save user information
    req.user = decoded;

    // Continue to the actual API
    next();

  } catch (error) {

    console.error(
      "Authentication error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Authentication server error",
    });
  }
};

module.exports = authenticateToken;