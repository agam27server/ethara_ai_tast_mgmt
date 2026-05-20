const Task = require("../models/Task");
const Project = require("../models/Project");

// Helper to broadcast socket event
const broadcastTaskUpdate = (req, projectId, task) => {
  const io = req.app.get("socketio");
  if (io) {
    io.to(projectId.toString()).emit("task_updated", {
      action: "update",
      task,
    });
  }
};

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { projectId, search, status, priority, sortBy, page = 1, limit = 50 } = req.query;

    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    // Verify project accessibility
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // If Member, check if they are part of the project
    if (req.user.role !== "Admin" && !project.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Access denied. You are not a member of this project" });
    }

    // Build query
    let query = { projectId };

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Sorting
    let sortQuery = { createdAt: -1 };
    if (sortBy === "dueDate") {
      sortQuery = { dueDate: 1 };
    } else if (sortBy === "priority") {
      // Custom sorting logic for priority is typically done on frontend,
      // but we can sort by priority string or fallback to createdAt
      sortQuery = { priority: 1 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Task.countDocuments(query);

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .populate("comments.user", "name email role")
      .populate("activities.user", "name email role")
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      tasks,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error("GetTasks Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Admin Only)
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, projectId, status, priority, dueDate } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: "Title and Project ID are required" });
    }

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const task = await Task.create({
      title,
      description: description || "",
      assignedTo: assignedTo || null,
      projectId,
      status: status || "Todo",
      priority: priority || "Medium",
      dueDate: dueDate || null,
      createdBy: req.user._id,
      activities: [{
        text: "Task created",
        user: req.user._id
      }]
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .populate("comments.user", "name email role")
      .populate("activities.user", "name email role");

    // Real-time broadcast
    broadcastTaskUpdate(req, projectId, populatedTask);

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error("CreateTask Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update task details (Admin can change everything, Member can update status only)
// @route   PUT /api/tasks/:id
// @access  Private (Both)
const updateTask = async (req, res) => {
  try {
    const { title, description, assignedTo, status, priority, dueDate } = req.body;
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: "Task project not found" });
    }

    // Security check: is member allowed in project?
    if (req.user.role !== "Admin" && !project.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to access this project" });
    }

    let activityText = "";

    // Role-based restrictions
    if (req.user.role === "Admin") {
      // Admin can update everything
      if (status && status !== task.status) {
        activityText += `Changed status to "${status}". `;
        task.status = status;
      }
      if (priority && priority !== task.priority) {
        activityText += `Changed priority to "${priority}". `;
        task.priority = priority;
      }
      if (title && title !== task.title) {
        activityText += `Renamed task to "${title}". `;
        task.title = title;
      }
      if (description !== undefined && description !== task.description) {
        activityText += `Updated description. `;
        task.description = description;
      }
      if (assignedTo !== undefined && String(assignedTo) !== String(task.assignedTo)) {
        task.assignedTo = assignedTo || null;
        activityText += assignedTo ? `Reassigned task. ` : `Removed assignee. `;
      }
      if (dueDate !== undefined && String(dueDate) !== String(task.dueDate)) {
        task.dueDate = dueDate || null;
        activityText += `Updated due date. `;
      }
    } else {
      // Member can ONLY update status
      if (status && status !== task.status) {
        activityText += `Changed status to "${status}". `;
        task.status = status;
      } else if (title || description || assignedTo || priority || dueDate) {
        return res.status(403).json({ message: "Members are only permitted to update task status" });
      }
    }

    if (activityText) {
      task.activities.push({
        text: activityText.trim(),
        user: req.user._id
      });
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .populate("comments.user", "name email role")
      .populate("activities.user", "name email role");

    // Real-time broadcast
    broadcastTaskUpdate(req, task.projectId, populatedTask);

    res.json(populatedTask);
  } catch (error) {
    console.error("UpdateTask Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin Only)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const projectId = task.projectId;

    await Task.deleteOne({ _id: req.params.id });

    // Real-time broadcast deletion
    const io = req.app.get("socketio");
    if (io) {
      io.to(projectId.toString()).emit("task_updated", {
        action: "delete",
        taskId: req.params.id,
      });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("DeleteTask Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    let task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Verify access
    if (req.user.role !== "Admin" && !project.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to comment on this task" });
    }

    task.comments.push({
      user: req.user._id,
      text
    });

    task.activities.push({
      text: `Added a comment: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
      user: req.user._id
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email role")
      .populate("comments.user", "name email role")
      .populate("activities.user", "name email role");

    // Real-time broadcast
    broadcastTaskUpdate(req, task.projectId, populatedTask);

    res.json(populatedTask);
  } catch (error) {
    console.error("AddComment Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  addComment,
};
