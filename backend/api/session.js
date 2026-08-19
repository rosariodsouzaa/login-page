require("dotenv").config();

const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {

  // ==================== CORS ====================

  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://front-end-eight-sooty.vercel.app"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // Handle browser preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ==================== ONLY GET ====================

  if (req.method !== "GET") {
    return res.status(405).json({
      message: "Method not allowed"
    });
  }

  // ==================== GET TOKEN ====================

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "No token provided"
    });
  }

  // Expected:
  // Authorization: Bearer YOUR_TOKEN

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }

  // ==================== VERIFY TOKEN ====================

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      success: true,
      user: decoded
    });

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "Invalid or expired session"
    });

  }
};