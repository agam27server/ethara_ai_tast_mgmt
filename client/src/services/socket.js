import { io } from "socket.io-client";

let socket;

export const initiateSocket = () => {
  // Uses Vite proxy in development or resolves to same host in production
  socket = io("/", {
    transports: ["websocket"],
  });
  console.log("Connecting socket...");
  return socket;
};

export const disconnectSocket = () => {
  console.log("Disconnecting socket...");
  if (socket) socket.disconnect();
};

export const joinProjectRoom = (projectId) => {
  if (socket && projectId) {
    socket.emit("join_project", projectId);
  }
};

export const leaveProjectRoom = (projectId) => {
  if (socket && projectId) {
    socket.emit("leave_project", projectId);
  }
};

export const subscribeToTaskUpdates = (cb) => {
  if (!socket) return;
  socket.on("task_updated", (data) => {
    console.log("Socket task update event received:", data);
    cb(data);
  });
};

export const unsubscribeFromTaskUpdates = () => {
  if (socket) {
    socket.off("task_updated");
  }
};
