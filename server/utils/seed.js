const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/team-task-manager";
    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    console.log("Existing collections cleared.");

    // Create users
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash("AdminPass123!", salt);
    const memberPassword = await bcrypt.hash("MemberPass123!", salt);

    const admin = await User.create({
      name: "Alice Smith (Admin)",
      email: "admin@taskmanager.com",
      password: adminPassword,
      role: "Admin",
    });

    const member1 = await User.create({
      name: "John Doe",
      email: "john@taskmanager.com",
      password: memberPassword,
      role: "Member",
    });

    const member2 = await User.create({
      name: "Jane Miller",
      email: "jane@taskmanager.com",
      password: memberPassword,
      role: "Member",
    });

    console.log("Sample Users created.");

    // Create Projects
    const project1 = await Project.create({
      title: "Apollo Website Redesign",
      description: "Overhaul Apollo corporate website to modern design and tech stack.",
      status: "Active",
      createdBy: admin._id,
      members: [member1._id, member2._id],
    });

    const project2 = await Project.create({
      title: "Mobile App Beta Development",
      description: "Build iOS and Android prototype for the task management product.",
      status: "Active",
      createdBy: admin._id,
      members: [member1._id], // John only
    });

    const project3 = await Project.create({
      title: "Marketing Campaign Q3",
      description: "Launch Q3 product updates campaign via socials and ads.",
      status: "Completed",
      createdBy: admin._id,
      members: [member2._id], // Jane only
    });

    console.log("Sample Projects created.");

    // Create Tasks for Project 1 (Apollo Website Redesign)
    const task1 = await Task.create({
      title: "Create wireframes & Figma mockups",
      description: "Design homepage, dashboard layout, and mobile drawer interfaces.",
      status: "Completed",
      priority: "High",
      assignedTo: member1._id,
      projectId: project1._id,
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Overdue/past due but completed
      createdBy: admin._id,
      activities: [
        { text: "Task created by Alice Smith (Admin)", user: admin._id, createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
        { text: "Status changed to Completed", user: member1._id, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
      ],
      comments: [
        { user: member1._id, text: "Figma link shared: figma.com/file/apollo-redesign", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
        { user: admin._id, text: "Looks outstanding! Approved.", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
      ]
    });

    const task2 = await Task.create({
      title: "Set up frontend structure & Tailwind",
      description: "Initialize client project, configure Tailwind, and set up routing structure.",
      status: "In Progress",
      priority: "Medium",
      assignedTo: member1._id,
      projectId: project1._id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Future due date
      createdBy: admin._id,
      activities: [
        { text: "Task created by Alice Smith (Admin)", user: admin._id, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { text: "Status updated to In Progress", user: member1._id, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
      ]
    });

    const task3 = await Task.create({
      title: "Develop REST API backend",
      description: "Write Express.js server, connect mongoose models, and structure CRUD endpoints.",
      status: "In Progress",
      priority: "High",
      assignedTo: member2._id,
      projectId: project1._id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Future due date
      createdBy: admin._id,
      activities: [
        { text: "Task created by Alice Smith (Admin)", user: admin._id, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { text: "Assigned to Jane Miller", user: admin._id, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { text: "Status changed to In Progress", user: member2._id, createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) }
      ],
      comments: [
        { user: member2._id, text: "Configuring controllers right now.", createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000) }
      ]
    });

    const task4 = await Task.create({
      title: "Integrate Socket.IO real-time sync",
      description: "Establish real-time broadcast of board task moves and notifications.",
      status: "Todo",
      priority: "High",
      assignedTo: member2._id,
      projectId: project1._id,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // OVERDUE
      createdBy: admin._id,
      activities: [
        { text: "Task created by Alice Smith (Admin)", user: admin._id, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
      ]
    });

    const task5 = await Task.create({
      title: "Write integration tests",
      description: "Use Supertest and Jest to write testing files for API verification.",
      status: "Todo",
      priority: "Low",
      assignedTo: member1._id,
      projectId: project1._id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
      activities: [
        { text: "Task created by Alice Smith (Admin)", user: admin._id, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
      ]
    });

    // Create Tasks for Project 2 (Mobile App Beta Development)
    await Task.create({
      title: "React Native Setup",
      description: "Create project directory with expo and check native builds.",
      status: "Todo",
      priority: "Medium",
      assignedTo: member1._id,
      projectId: project2._id,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      createdBy: admin._id,
      activities: [
        { text: "Task created", user: admin._id }
      ]
    });

    console.log("Sample Tasks created.");
    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
