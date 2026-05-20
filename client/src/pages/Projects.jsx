import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Users,
  FolderOpen,
  Calendar,
  X,
  UserPlus
} from "lucide-react";

export default function Projects() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]); // All users list for assignments
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("create"); // 'create' or 'edit'
  const [currentProject, setCurrentProject] = useState(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [status, setStatus] = useState("Active");

  useEffect(() => {
    fetchProjects();
    if (isAdmin()) {
      fetchUsers();
    }
  }, [toast]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get("/projects");
      setProjects(response.data);
    } catch (err) {
      console.error(err);
      toast("Failed to load projects.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openCreateModal = () => {
    setModalType("create");
    setTitle("");
    setDescription("");
    setSelectedMembers([]);
    setStatus("Active");
    setIsModalOpen(true);
  };

  const openEditModal = (project) => {
    setModalType("edit");
    setCurrentProject(project);
    setTitle(project.title);
    setDescription(project.description);
    setSelectedMembers(project.members.map((m) => m._id));
    setStatus(project.status);
    setIsModalOpen(true);
  };

  const handleMemberToggle = (userId) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast("Project title is required", "error");
      return;
    }

    try {
      const projectData = {
        title,
        description,
        members: selectedMembers,
        status,
      };

      if (modalType === "create") {
        const res = await api.post("/projects", projectData);
        setProjects((prev) => [res.data, ...prev]);
        toast("Project created successfully!", "success");
      } else {
        const res = await api.put(`/projects/${currentProject._id}`, projectData);
        setProjects((prev) =>
          prev.map((p) => (p._id === currentProject._id ? res.data : p))
        );
        toast("Project updated successfully!", "success");
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast("Failed to save project.", "error");
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project? This will permanently delete all associated tasks!")) {
      return;
    }

    try {
      await api.delete(`/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      toast("Project deleted successfully.", "success");
    } catch (err) {
      console.error(err);
      toast("Failed to delete project.", "error");
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-48"></div>
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in text-left">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-3xl">
            Projects Workspace
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Manage your team, coordinate assignments, and open boards.
          </p>
        </div>

        {isAdmin() && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Projects Grid List */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              className="group flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div>
                {/* Project Status & Details */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase border ${
                    project.status === "Active"
                      ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200/40 dark:border-indigo-900/30"
                      : project.status === "Completed"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200/40 dark:border-emerald-900/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 border-slate-200/40 dark:border-slate-700/40"
                  }`}>
                    {project.status}
                  </span>

                  {isAdmin() && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(project)}
                        title="Edit Project"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(project._id)}
                        title="Delete Project"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100 line-clamp-1 mb-2">
                  {project.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mb-6">
                  {project.description || "No project description provided."}
                </p>
              </div>

              {/* Members lists & Access button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                <div className="flex -space-x-2.5 overflow-hidden" title={`${project.members?.length || 0} members assigned`}>
                  {project.members && project.members.length > 0 ? (
                    project.members.slice(0, 4).map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 font-extrabold text-[10px] ring-2 ring-white dark:ring-slate-900 border border-slate-200 dark:border-slate-800"
                        title={member.name}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5" /> No members
                    </div>
                  )}
                  {project.members && project.members.length > 4 && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] ring-2 ring-white dark:ring-slate-900 border border-indigo-100 dark:border-indigo-900/30">
                      +{project.members.length - 4}
                    </div>
                  )}
                </div>

                <Link
                  to={`/projects/${project._id}`}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-350"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Open Board</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-sm">
          <Briefcase className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Projects Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto font-medium">
            {isAdmin()
              ? "Get started by building your first active collaborative project canvas."
              : "You are not assigned to any projects at the moment. Ask an administrator to assign you."}
          </p>
          {isAdmin() && (
            <button
              onClick={openCreateModal}
              className="mt-6 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/10 transition-all active:scale-[0.98]"
            >
              Create Project
            </button>
          )}
        </div>
      )}

      {/* CRUD PROJECT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 md:p-8">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-855 dark:text-slate-100">
                {modalType === "create" ? "Create New Project" : "Edit Project Settings"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-650 dark:hover:text-slate-250 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Apollo Client Redesign"
                  className="block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the core focus and criteria for this project..."
                  className="block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-650 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none"
                />
              </div>

              {/* Status (Only in edit mode) */}
              {modalType === "edit" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                    Project Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              )}

              {/* Invite/Assign Members */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Assign Workspace Members
                </label>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl max-h-36 overflow-y-auto p-3.5 space-y-2 bg-slate-50/50 dark:bg-slate-950/50">
                  {users.length > 0 ? (
                    users.map((item) => (
                      <label
                        key={item._id}
                        className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(item._id)}
                          onChange={() => handleMemberToggle(item._id)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <div className="flex-grow flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {item.name}
                          </span>
                          <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                            {item.role}
                          </span>
                        </div>
                      </label>
                    ))
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-3 font-medium">No team members registered yet.</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/10 transition-all active:scale-[0.98]"
                >
                  {modalType === "create" ? "Create Project" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
