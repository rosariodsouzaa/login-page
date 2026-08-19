require("dotenv").config();

const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {

  if (req.method !== "GET") {
    return res.status(405).json({
      message: "Method not allowed"
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "No token provided"
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }

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