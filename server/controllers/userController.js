const User = require("../models/User");

// @desc    Get all users
// @route   GET /api/users
// @access  Private
const getUsers = async (req, res) => {
  try {
    // Select all fields except password
    const users = await User.find({}).select("-password").sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error("GetUsers Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getUsers,
};
