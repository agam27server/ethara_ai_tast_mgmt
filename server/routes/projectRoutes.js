const express = require("express");
const {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, getProjects);
router.post("/", protect, authorize("Admin"), createProject);
router.put("/:id", protect, authorize("Admin"), updateProject);
router.delete("/:id", protect, authorize("Admin"), deleteProject);

module.exports = router;
