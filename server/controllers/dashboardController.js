const Task = require("../models/Task");
const Project = require("../models/Project");

// @desc    Get dashboard metrics & activity feed
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    let projectIds = [];

    // 1. Get the list of projects this user has access to
    if (req.user.role === "Admin") {
      const projects = await Project.find({});
      projectIds = projects.map((p) => p._id);
    } else {
      const projects = await Project.find({ members: req.user._id });
      projectIds = projects.map((p) => p._id);
    }

    if (projectIds.length === 0) {
      return res.json({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        statusDistribution: { Todo: 0, "In Progress": 0, Completed: 0 },
        priorityDistribution: { Low: 0, Medium: 0, High: 0 },
        recentActivity: [],
      });
    }

    // 2. Fetch all tasks within those projects
    const tasks = await Task.find({ projectId: { $in: projectIds } })
      .populate("assignedTo", "name email role")
      .populate("projectId", "title")
      .populate("activities.user", "name email role")
      .sort({ updatedAt: -1 });

    // 3. Compute statistics
    const totalTasks = tasks.length;
    let completedTasks = 0;
    let pendingTasks = 0;
    let overdueTasks = 0;

    const statusDistribution = { Todo: 0, "In Progress": 0, Completed: 0 };
    const priorityDistribution = { Low: 0, Medium: 0, High: 0 };
    const now = new Date();

    tasks.forEach((task) => {
      // Status
      statusDistribution[task.status] = (statusDistribution[task.status] || 0) + 1;
      if (task.status === "Completed") {
        completedTasks++;
      } else {
        pendingTasks++;
        // Check if overdue
        if (task.dueDate && new Date(task.dueDate) < now) {
          overdueTasks++;
        }
      }

      // Priority
      priorityDistribution[task.priority] = (priorityDistribution[task.priority] || 0) + 1;
    });

    // 4. Compile recent activity feed across all tasks
    let recentActivity = [];
    tasks.forEach((task) => {
      if (task.activities && task.activities.length > 0) {
        task.activities.forEach((act) => {
          recentActivity.push({
            taskId: task._id,
            taskTitle: task.title,
            projectTitle: task.projectId ? task.projectId.title : "Unknown Project",
            text: act.text,
            user: act.user ? {
              _id: act.user._id,
              name: act.user.name,
              role: act.user.role,
            } : null,
            createdAt: act.createdAt,
          });
        });
      }
    });

    // Sort activity feed by date (newest first)
    recentActivity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    // Limit to top 15 activities
    recentActivity = recentActivity.slice(0, 15);

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      statusDistribution,
      priorityDistribution,
      recentActivity,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getDashboardStats,
};
