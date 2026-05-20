const Project = require("../models/Project");
const Task = require("../models/Task");

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
  try {
    let query = {};

    // If Member, show only projects where they are in the members list
    if (req.user.role !== "Admin") {
      query.members = req.user._id;
    }

    const projects = await Project.find(query)
      .populate("createdBy", "name email role")
      .populate("members", "name email role")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error("GetProjects Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Admin Only)
const createProject = async (req, res) => {
  try {
    const { title, description, members, status } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Project title is required" });
    }

    const project = await Project.create({
      title,
      description: description || "",
      members: members || [],
      status: status || "Active",
      createdBy: req.user._id,
    });

    const populatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email role")
      .populate("members", "name email role");

    res.status(201).json(populatedProject);
  } catch (error) {
    console.error("CreateProject Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (Admin Only)
const updateProject = async (req, res) => {
  try {
    const { title, description, members, status } = req.body;

    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    project.title = title || project.title;
    project.description = description !== undefined ? description : project.description;
    project.members = members || project.members;
    project.status = status || project.status;

    await project.save();

    const populatedProject = await Project.findById(project._id)
      .populate("createdBy", "name email role")
      .populate("members", "name email role");

    res.json(populatedProject);
  } catch (error) {
    console.error("UpdateProject Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private (Admin Only)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Delete all tasks associated with this project
    await Task.deleteMany({ projectId: req.params.id });

    // Delete the project
    await Project.deleteOne({ _id: req.params.id });

    res.json({ message: "Project and all associated tasks deleted successfully" });
  } catch (error) {
    console.error("DeleteProject Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
};
