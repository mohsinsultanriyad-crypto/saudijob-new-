import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_BASE || "https://saudijob-new.onrender.com";

export const api = axios.create({ baseURL: API_BASE });

// --------------------------

export async function getJobs({ limit = 20, skip = 0, city = "All", role = "All", q = "" } = {}) {
  const params = { limit, skip };
  if (city && city !== "All") params.city = city;
  if (role && role !== "All") params.role = role;
  if (q) params.q = q;
  return (await api.get("/api/jobs", { params })).data;
}

export async function getMyPosts({ email, limit = 20, skip = 0 }) {
  return (await api.get("/api/my-posts", { params: { email, limit, skip } })).data;
}

// CREATE JOB
export const createJob = async (payload) =>
  (await api.post("/api/jobs", {
    ...payload,
    email: (payload.email || "").trim().toLowerCase()
  })).data;

// ADD VIEW
export const addView = async (id) =>
  (await api.post(`/api/jobs/${id}/view`)).data;

export const updateJob = async (id, email, payload) =>
  (await api.put(`/api/jobs/${id}`, payload, { params: { email } })).data;

export const deleteJob = async (id, email) =>
  (await api.delete(`/api/jobs/${id}`, { params: { email } })).data;