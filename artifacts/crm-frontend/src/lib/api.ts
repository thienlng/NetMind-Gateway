import type { User, Model, Project, ProjectMember, ProjectModelEntry, Key, KeyCreateResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "/crm-api";

export function getToken(): string | null {
  try {
    return localStorage.getItem("crm_token");
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  localStorage.setItem("crm_token", token);
}

export function clearToken() {
  localStorage.removeItem("crm_token");
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (res.status === 204) return {} as T;

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body?.detail || `HTTP ${res.status}`);
  }
  return body as T;
}

export const authApi = {
  login: (username: string, password: string) =>
    req<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  me: () => req<User>("/auth/me"),
};

export const usersApi = {
  list: () => req<User[]>("/users"),
  create: (data: { username: string; email: string; password: string; full_name: string; role: string }) =>
    req<User>("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ email: string; full_name: string; role: string; password: string }>) =>
    req<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => req<void>(`/users/${id}`, { method: "DELETE" }),
};

export const modelsApi = {
  list: () => req<Model[]>("/models"),
  sync: () => req<{ synced: number; errors: string[] }>("/models/sync", { method: "POST" }),
  update: (id: string, data: { general_model_name?: string; release_date?: string; context_length?: number }) =>
    req<Model>(`/models/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

export const projectsApi = {
  list: () => req<Project[]>("/projects"),
  create: (data: { project_name: string; project_alias: string }) =>
    req<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),
  get: (id: string) => req<Project>(`/projects/${id}`),
  update: (id: string, data: Partial<{ project_name: string; project_alias: string }>) =>
    req<Project>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string) => req<void>(`/projects/${id}`, { method: "DELETE" }),

  listMembers: (id: string) => req<ProjectMember[]>(`/projects/${id}/members`),
  addMember: (id: string, user_id: string, role: string) =>
    req<ProjectMember>(`/projects/${id}/members`, { method: "POST", body: JSON.stringify({ user_id, role }) }),
  updateMember: (id: string, userId: string, role: string) =>
    req<ProjectMember>(`/projects/${id}/members/${userId}`, { method: "PATCH", body: JSON.stringify({ role }) }),
  removeMember: (id: string, userId: string) =>
    req<void>(`/projects/${id}/members/${userId}`, { method: "DELETE" }),

  listModels: (id: string) => req<ProjectModelEntry[]>(`/projects/${id}/models`),
  addModel: (id: string, model_id: string) =>
    req<ProjectModelEntry>(`/projects/${id}/models`, { method: "POST", body: JSON.stringify({ model_id }) }),
  removeModel: (id: string, modelId: string) =>
    req<void>(`/projects/${id}/models/${modelId}`, { method: "DELETE" }),
};

export const keysApi = {
  list: () => req<Key[]>("/keys"),
  create: (data: {
    key_name: string;
    project_id: string;
    user_id?: string;
    type: string;
    max_budget?: number;
    expires?: string;
    models?: string[];
    tpm_limit?: number;
    rpm_limit?: number;
  }) => req<KeyCreateResponse>("/keys", { method: "POST", body: JSON.stringify(data) }),
  get: (id: string) => req<Key>(`/keys/${id}`),
  delete: (id: string) => req<void>(`/keys/${id}`, { method: "DELETE" }),
  regenerate: (id: string) => req<KeyCreateResponse>(`/keys/${id}/regenerate`, { method: "POST" }),
};
