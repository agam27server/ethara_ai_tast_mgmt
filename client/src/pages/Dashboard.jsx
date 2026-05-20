import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import {
  Layers,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  Calendar,
  User,
  Zap
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast("Failed to load dashboard metrics.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-8 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-md w-48"></div>
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const {
    totalTasks = 0,
    completedTasks = 0,
    pendingTasks = 0,
    overdueTasks = 0,
    statusDistribution = {},
    priorityDistribution = {},
    recentActivity = [],
  } = stats || {};

  // Recharts formatted data
  const statusData = [
    { name: "Todo", value: statusDistribution.Todo || 0, color: "#6366f1" },
    { name: "In Progress", value: statusDistribution["In Progress"] || 0, color: "#f59e0b" },
    { name: "Completed", value: statusDistribution.Completed || 0, color: "#10b981" },
  ].filter((item) => item.value > 0);

  const priorityData = [
    { name: "Low", value: priorityDistribution.Low || 0, color: "#10b981" },
    { name: "Medium", value: priorityDistribution.Medium || 0, color: "#f59e0b" },
    { name: "High", value: priorityDistribution.High || 0, color: "#ef4444" },
  ];

  const cards = [
    { title: "Total Tasks", value: totalTasks, icon: Layers, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/20" },
    { title: "Completed Tasks", value: completedTasks, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/20" },
    { title: "Pending Tasks", value: pendingTasks, icon: Clock, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/20" },
    { title: "Overdue Tasks", value: overdueTasks, icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/20" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 md:text-3xl">
            Overview Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Monitor metrics, priorities, and workflow timelines.
          </p>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm flex items-center justify-between transition-transform duration-200 hover:-translate-y-0.5 ${c.color.split(" ").slice(-1)[0]}`}
            >
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {c.title}
                </p>
                <h3 className="text-3xl font-extrabold text-slate-850 dark:text-slate-100 mt-2">
                  {c.value}
                </h3>
              </div>
              <div className={`p-4 rounded-2xl ${c.color.split(" ").slice(0, 3).join(" ")}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts & Graphs section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks status pie chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 uppercase tracking-wider text-left">
            Tasks by Status
          </h3>
          <div className="h-64 flex-1 flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <p className="text-sm font-medium">No tasks available to chart</p>
              </div>
            )}
          </div>
        </div>

        {/* Tasks priority distribution */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 uppercase tracking-wider text-left">
            Priority Distribution
          </h3>
          <div className="h-64 flex-1">
            {totalTasks > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p className="text-sm font-medium">No tasks available to chart</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity feed */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-6 uppercase tracking-wider text-left">
          Workspace Activity Timeline
        </h3>
        {recentActivity.length > 0 ? (
          <div className="relative border-l border-slate-100 dark:border-slate-800 ml-4 pl-6 space-y-6 max-h-[400px] overflow-y-auto pr-2">
            {recentActivity.map((act, index) => (
              <div key={index} className="relative group text-left">
                {/* Timeline dot */}
                <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm group-hover:scale-125 transition-transform"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5">
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      {act.user ? act.user.name : "System"}
                    </span>{" "}
                    {act.text.toLowerCase()} on{" "}
                    <Link
                      to={`/projects`}
                      className="text-indigo-650 dark:text-indigo-400 font-extrabold hover:underline"
                    >
                      {act.taskTitle}
                    </Link>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(act.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">
                  Project: {act.projectTitle}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400">
            <Zap className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold">Timeline Empty</p>
            <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">
              Changes to tasks and comments will be logged here in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
