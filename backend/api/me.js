const authenticateToken = require("./auth");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  // Check JWT + database session
  const authenticated = await authenticateToken(req, res);

  if (!authenticated) {
    return;
  }

  return res.status(200).json({
    success: true,
    user: req.user
  });
};