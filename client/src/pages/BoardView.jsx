import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  initiateSocket,
  disconnectSocket,
  joinProjectRoom,
  leaveProjectRoom,
  subscribeToTaskUpdates,
  unsubscribeFromTaskUpdates,
} from "../services/socket";
import {
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Clock,
  MessageSquare,
  Activity,
  Trash2,
  Edit,
  X,
  User,
  Calendar,
  Tag
} from "lucide-react";

export default function BoardView() {
  const { projectId } = useParams();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [sortBy, setSortBy] = useState("");

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalType, setTaskModalType] = useState("create"); // 'create', 'view'
  const [selectedTask, setSelectedTask] = useState(null);

  // Task Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStatus, setTaskStatus] = useState("Todo");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");

  // Comment Form State
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    // 1. Fetch Project Details & initial tasks
    fetchProjectDetails();
    fetchTasks();

    // 2. Setup WebSockets
    const socket = initiateSocket();
    joinProjectRoom(projectId);

    subscribeToTaskUpdates((data) => {
      if (data.action === "delete") {
        setTasks((prev) => prev.filter((t) => t._id !== data.taskId));
      } else {
        // Update or insert task
        setTasks((prev) => {
          const exists = prev.some((t) => t._id === data.task._id);
          if (exists) {
            return prev.map((t) => (t._id === data.task._id ? data.task : t));
          } else {
            return [data.task, ...prev];
          }
        });
      }
    });

    return () => {
      leaveProjectRoom(projectId);
      unsubscribeFromTaskUpdates();
      disconnectSocket();
    };
  }, [projectId]);

  // Sync selected task comments/activities if it updates in real time
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find((t) => t._id === selectedTask._id);
      if (updated) {
        setSelectedTask(updated);
      }
    }
  }, [tasks]);

  const fetchProjectDetails = async () => {
    try {
      // Find the specific project by loading all projects and matching ID
      const response = await api.get("/projects");
      const matched = response.data.find((p) => p._id === projectId);
      if (matched) {
        setProject(matched);
      } else {
        toast("Project not found.", "error");
      }
    } catch (err) {
      console.error(err);
      toast("Error loading project information.", "error");
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/tasks?projectId=${projectId}`);
      setTasks(response.data.tasks);
    } catch (err) {
      console.error(err);
      toast("Error loading tasks.", "error");
    } finally {
      setLoading(false);
    }
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const task = tasks.find((t) => t._id === taskId);

    if (!task) return;
    if (task.status === targetStatus) return; // Unchanged

    // Save previous status for optimistic rollback
    const prevStatus = task.status;

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      await api.put(`/tasks/${taskId}`, { status: targetStatus });
      toast(`Moved to "${targetStatus}"`, "success");
    } catch (err) {
      console.error(err);
      toast("Failed to update status. Reverting changes.", "error");
      // Rollback optimistic update
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? { ...t, status: prevStatus } : t))
      );
    }
  };

  // Form Handlers
  const handleCreateTaskOpen = (colStatus = "Todo") => {
    setTaskModalType("create");
    setTaskTitle("");
    setTaskDesc("");
    setTaskStatus(colStatus);
    setTaskPriority("Medium");
    setTaskDueDate("");
    setTaskAssignedTo("");
    setIsTaskModalOpen(true);
  };

  const handleViewTaskOpen = (task) => {
    setTaskModalType("view");
    setSelectedTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description);
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setTaskAssignedTo(task.assignedTo?._id || "");
    setNewComment("");
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      toast("Task title is required", "error");
      return;
    }

    try {
      const taskData = {
        title: taskTitle,
        description: taskDesc,
        status: taskStatus,
        priority: taskPriority,
        dueDate: taskDueDate || null,
        assignedTo: taskAssignedTo || null,
        projectId,
      };

      if (taskModalType === "create") {
        const res = await api.post("/tasks", taskData);
        setTasks((prev) => [res.data, ...prev]);
        toast("Task created successfully!", "success");
      } else {
        const res = await api.put(`/tasks/${selectedTask._id}`, taskData);
        setTasks((prev) =>
          prev.map((t) => (t._id === selectedTask._id ? res.data : t))
        );
        toast("Task updated successfully!", "success");
      }
      setIsTaskModalOpen(false);
    } catch (err) {
      console.error(err);
      toast(err.response?.data?.message || "Failed to save task.", "error");
    }
  };

  const handleStatusChangeOnly = async (taskId, newStatus) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? res.data : t))
      );
      toast(`Status updated to ${newStatus}`, "success");
    } catch (err) {
      console.error(err);
      toast("Failed to update status.", "error");
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      setIsTaskModalOpen(false);
      toast("Task deleted successfully.", "success");
    } catch (err) {
      console.error(err);
      toast("Failed to delete task.", "error");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await api.post(`/tasks/${selectedTask._id}/comments`, {
        text: newComment,
      });
      // Updating local state updates selectedTask details automatically
      setTasks((prev) =>
        prev.map((t) => (t._id === selectedTask._id ? response.data : t))
      );
      setNewComment("");
      toast("Comment added.", "success");
    } catch (err) {
      console.error(err);
      toast("Failed to add comment.", "error");
    }
  };

  // Filter and sort computation
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter ? task.priority === priorityFilter : true;
    const matchesAssignee = assigneeFilter
      ? task.assignedTo?._id === assigneeFilter
      : true;
    return matchesSearch && matchesPriority && matchesAssignee;
  });

  if (sortBy === "dueDate") {
    filteredTasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } else if (sortBy === "priority") {
    const weight = { High: 3, Medium: 2, Low: 1 };
    filteredTasks.sort((a, b) => weight[b.priority] - weight[a.priority]);
  }

  const todoTasks = filteredTasks.filter((t) => t.status === "Todo");
  const inProgressTasks = filteredTasks.filter((t) => t.status === "In Progress");
  const completedTasksList = filteredTasks.filter((t) => t.status === "Completed");

  const boardColumns = [
    { title: "Todo", tasks: todoTasks, key: "Todo", color: "border-t-indigo-500", dot: "bg-indigo-500" },
    { title: "In Progress", tasks: inProgressTasks, key: "In Progress", color: "border-t-amber-500", dot: "bg-amber-500" },
    { title: "Completed", tasks: completedTasksList, key: "Completed", color: "border-t-emerald-500", dot: "bg-emerald-500" },
  ];

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex flex-col h-[calc(100vh-80px)] overflow-hidden text-left animate-fade-in">
      {/* Upper Navigation Links & Info */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            to="/projects"
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-655 dark:hover:text-slate-250 mb-2.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Projects
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-2xl">
            {project?.title || "Project Board"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 line-clamp-1">
            {project?.description || "Collaborative project Kanban workspace."}
          </p>
        </div>

        {/* Member list badges */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2.5 overflow-hidden">
            {project?.members?.map((m) => (
              <div
                key={m._id}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-[10px] ring-2 ring-white dark:ring-slate-900 border border-slate-200 dark:border-slate-800"
                title={`${m.name} (${m.role})`}
              >
                {m.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm mb-6">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="block w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="block w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">All Priorities</option>
          <option value="Low">Low Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="High">High Priority</option>
        </select>

        {/* Assignee Filter */}
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="block w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">All Assignees</option>
          {project?.members?.map((m) => (
            <option key={m._id} value={m._id}>
              {m.name}
            </option>
          ))}
        </select>

        {/* Sorting option */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="block w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">Sort By</option>
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
        </select>
      </div>

      {/* Board Kanban Area */}
      <div className="flex-grow overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 h-full min-w-[800px]">
          {boardColumns.map((col) => (
            <div
              key={col.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.key)}
              className="flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/40 rounded-2xl p-4 overflow-hidden"
            >
              {/* Column Header */}
              <div className="flex-shrink-0 flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`}></span>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350">
                    {col.title}
                  </h3>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md">
                    {col.tasks.length}
                  </span>
                </div>

                {isAdmin() && (
                  <button
                    onClick={() => handleCreateTaskOpen(col.key)}
                    className="p-1 rounded bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {col.tasks.length > 0 ? (
                  col.tasks.map((task) => {
                    const isOverdue =
                      task.status !== "Completed" &&
                      task.dueDate &&
                      new Date(task.dueDate) < new Date();
                    return (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        onClick={() => handleViewTaskOpen(task)}
                        className={`p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 cursor-grab active:cursor-grabbing transition-all border-t-4 ${col.color}`}
                      >
                        {/* Title */}
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1 mb-1.5">
                          {task.title}
                        </h4>
                        {/* Description */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mb-3.5">
                          {task.description || "No description provided."}
                        </p>

                        {/* Badges & Meta */}
                        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-50 dark:border-slate-800/40">
                          <div className="flex items-center gap-1.5">
                            {/* Priority badge */}
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide border ${
                              task.priority === "High"
                                ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200/40 dark:border-rose-900/30"
                                : task.priority === "Medium"
                                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200/40 dark:border-amber-900/30"
                                : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/40 dark:border-emerald-900/30"
                            }`}>
                              {task.priority}
                            </span>

                            {/* Overdue alert */}
                            {isOverdue && (
                              <span className="flex items-center gap-0.5 text-[8px] font-extrabold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-1 py-0.5 rounded uppercase border border-rose-200/30 dark:border-rose-900/30">
                                <Clock className="w-2.5 h-2.5" />
                                Overdue
                              </span>
                            )}
                          </div>

                          {/* Assignee initials badge */}
                          {task.assignedTo ? (
                            <div
                              className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900/30 font-extrabold text-[9px]"
                              title={`Assigned to ${task.assignedTo.name}`}
                            >
                              {task.assignedTo.name.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400" title="Unassigned">
                              <User className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                    <p className="text-xs font-semibold">Drop tasks here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE/EDIT/VIEW TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
            
            {/* Left side: Task settings form */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {taskModalType === "create" ? "Create New Task" : "Task Details"}
                </h3>
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleTaskSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    disabled={!isAdmin() && taskModalType === "view"}
                    placeholder="e.g. Write integration test suites"
                    className="block w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-75 disabled:pointer-events-none transition-all"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    disabled={!isAdmin() && taskModalType === "view"}
                    placeholder="Provide description context..."
                    className="block w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-75 disabled:pointer-events-none transition-all resize-none"
                  />
                </div>

                {/* Grid for settings: status, priority, due date, assignee */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Status */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      Status
                    </label>
                    <select
                      value={taskStatus}
                      onChange={(e) => {
                        if (taskModalType === "view") {
                          if (isAdmin()) {
                            setTaskStatus(e.target.value);
                          } else {
                            // Member updates status directly via backend
                            handleStatusChangeOnly(selectedTask._id, e.target.value);
                          }
                        } else {
                          setTaskStatus(e.target.value);
                        }
                      }}
                      className="block w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                    >
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      Priority
                    </label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      disabled={!isAdmin() && taskModalType === "view"}
                      className="block w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-75 cursor-pointer"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      disabled={!isAdmin() && taskModalType === "view"}
                      className="block w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-75 cursor-pointer"
                    />
                  </div>

                  {/* Assignee */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                      Assignee
                    </label>
                    <select
                      value={taskAssignedTo}
                      onChange={(e) => setTaskAssignedTo(e.target.value)}
                      disabled={!isAdmin() && taskModalType === "view"}
                      className="block w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 focus:outline-none disabled:opacity-75 cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {project?.members?.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Creator Details (For view modal only) */}
                {taskModalType === "view" && selectedTask?.createdBy && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Created by: <span className="font-semibold">{selectedTask.createdBy.name}</span>
                  </p>
                )}

                {/* Form Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  {isAdmin() && taskModalType === "view" ? (
                    <button
                      type="button"
                      onClick={() => handleTaskDelete(selectedTask._id)}
                      className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Task
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsTaskModalOpen(false)}
                      className="px-3.5 py-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    {(isAdmin() || taskModalType === "create") && (
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/10 transition-all active:scale-[0.98]"
                      >
                        {taskModalType === "create" ? "Create Task" : "Save Changes"}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Right side: Comments and activity logs (Only in view mode) */}
            {taskModalType === "view" && (
              <div className="w-full md:w-80 flex flex-col h-[400px] md:h-auto border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800/80 pt-6 md:pt-0 md:pl-6 overflow-hidden">
                {/* Header Toggles */}
                <div className="flex-shrink-0 flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-655 dark:text-slate-350 flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" /> Comments ({selectedTask?.comments?.length || 0})
                  </span>
                  <button
                    onClick={() => setIsTaskModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hidden lg:block"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Timeline comments & logs container */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
                  {/* Comments Feed */}
                  {selectedTask?.comments && selectedTask.comments.length > 0 ? (
                    <div className="space-y-3">
                      {selectedTask.comments.map((comment, index) => (
                        <div
                          key={index}
                          className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                              {comment.user ? comment.user.name : "Unknown"}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(comment.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">
                            {comment.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-6">No comments yet. Write one below.</p>
                  )}

                  {/* Simple Activities Timeline */}
                  {selectedTask?.activities && selectedTask.activities.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
                      <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                        Activity History
                      </p>
                      <div className="space-y-2 border-l border-slate-100 dark:border-slate-800 ml-1.5 pl-3">
                        {selectedTask.activities.slice(-5).map((act, index) => (
                          <div key={index} className="text-[10px] text-slate-500 relative">
                            <div className="absolute -left-[16px] top-1 w-1.5 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                            <span className="font-semibold text-slate-600 dark:text-slate-400">
                              {act.user ? act.user.name : "System"}
                            </span>{" "}
                            {act.text.toLowerCase()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Comment Posting Input */}
                <form onSubmit={handleCommentSubmit} className="flex-shrink-0 mt-auto">
                  <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl p-1.5 focus-within:ring-1 focus-within:ring-indigo-500">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-grow bg-transparent text-xs px-2.5 py-1.5 focus:outline-none text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none text-white text-[10px] font-bold rounded-lg transition-colors"
                    >
                      Post
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
