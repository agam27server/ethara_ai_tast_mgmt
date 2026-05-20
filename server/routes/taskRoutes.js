const express = require("express");
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  addComment,
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, getTasks);
router.post("/", protect, authorize("Admin"), createTask);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, authorize("Admin"), deleteTask);
router.post("/:id/comments", protect, addComment);

module.exports = router;
