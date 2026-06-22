import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const getToken = () => localStorage.getItem("token");

const request = async (method, endpoint, data = null) => {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const response = await axios({ method, url: `${BASE_URL}${endpoint}`, headers, data });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Something went wrong");
  }
};

export const api = {
  get:    (endpoint)       => request("GET",    endpoint),
  post:   (endpoint, data) => request("POST",   endpoint, data),
  put:    (endpoint, data) => request("PUT",    endpoint, data),
  patch:  (endpoint, data) => request("PATCH",  endpoint, data),
  delete: (endpoint)       => request("DELETE", endpoint),
};

export const saveSession = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const getSession = () => {
  const user = localStorage.getItem("user");
  return {
    token: localStorage.getItem("token"),
    user: user ? JSON.parse(user) : null,
  };
};

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const roleToRoute = {
  CompanyAdmin: "/cadmin",
  Employee: "/empdash",
  TeamLead: "/teamlead",
  HR: "/hrdash",
  Finance: "/finance",
  SuperAdmin: "/superadmin",
};

const AVATAR_COLORS = [
  "#2563eb","#7c3aed","#d97706","#db2777",
  "#10b981","#0d9488","#dc2626","#ea580c","#0891b2","#65a30d",
];
export const getAvatarColor = (seed = "") => {
  const n = seed.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
};

export const getInitials = (name = "") =>
  name.split(" ").map(w => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2) || "??";

export const chatApi = {
  getChannels:      ()                   => api.get("/chat/channels"),
  getDMs:           ()                   => api.get("/chat/dms"),
  getGroups:        ()                   => api.get("/chat/groups"),
  getMembers:       ()                   => api.get("/chat/members"),
  getNotifications: ()                   => api.get("/chat/notifications"),
  getMessages:      (chatId)             => api.get(`/chat/messages/${chatId}`),
  getPinned:        (chatId)             => api.get(`/chat/pinned/${chatId}`),
  getFiles:         (chatId)             => api.get(`/chat/files/${chatId}`),
  sendMessage:      (chatId, data)       => api.post(`/chat/messages/${chatId}`, data),
  pinMessage:       (chatId, msgId)      => api.patch(`/chat/messages/${chatId}/${msgId}/pin`, {}),
  clearChat:        (chatId)             => api.delete(`/chat/messages/${chatId}`),
  updateStatus:     (status)             => api.put("/chat/status", { status }),
  createChannel:    (data)               => api.post("/chat/channels", data),
  deleteChannel:    (channelId)          => api.delete(`/chat/channels/${channelId}`),
  createGroup:      (data)               => api.post("/chat/groups", data),
  addGroupMembers:  (groupId, members)   => api.put(`/chat/groups/${groupId}/members`, { members }),
};
