const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1";

export type UserRole = "CLIENT" | "FREELANCER" | "ADMIN";
export type Currency = "USD" | "MMK";

export type Profile = {
  id: string;
  userId: string;
  name: string;
  headline?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  location?: string | null;
};

export type User = {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  profile: Profile | null;
  createdAt?: string;
};

export type Skill = { id: string; name: string; slug: string };

export type Job = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  budgetAmount: number;
  budgetCurrency: Currency;
  status: string;
  deadline: string | null;
  createdAt: string;
  publishedAt: string | null;
  client: { id: string; profile: { name: string; avatarUrl: string | null } | null };
  skills: { skill: Skill }[];
};

export type Proposal = {
  id: string;
  coverLetter: string;
  bidAmount: number;
  bidCurrency: Currency;
  estimatedDays: number | null;
  status: "SUBMITTED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  createdAt: string;
  updatedAt: string;
  freelancer: { id: string; email: string; profile: Profile | null };
  job: {
    id: string;
    title: string;
    description: string;
    budgetAmount: number;
    budgetCurrency: Currency;
    status: string;
    clientId: string;
    client: { id: string; email: string; profile: Profile | null };
  };
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  payload: string | null;
  readAt: string | null;
  createdAt: string;
};

export type Milestone = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  amount: number;
  currency: Currency;
  dueDate: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  sender: { id: string; email: string; profile: Profile | null };
};

export type Project = {
  id: string;
  clientId: string;
  freelancerId: string;
  agreedAmount: number;
  agreedCurrency: Currency;
  status: "NOT_STARTED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  job: { id: string; title: string; description: string; budgetAmount: number; budgetCurrency: Currency; status: string; deadline: string | null };
  client: { id: string; email: string; profile: Profile | null };
  freelancer: { id: string; email: string; profile: Profile | null };
  acceptedProposal: { id: string; coverLetter: string; bidAmount: number; bidCurrency: Currency; estimatedDays: number | null } | null;
  milestones: Milestone[];
  conversation: { id: string; messages: Message[] } | null;
};

type ApiEnvelope<T> = { data: T; meta?: Record<string, unknown> };

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const getAccessToken = () => window.localStorage.getItem("archer.accessToken");

export const saveTokens = (accessToken: string, refreshToken: string) => {
  window.localStorage.setItem("archer.accessToken", accessToken);
  window.localStorage.setItem("archer.refreshToken", refreshToken);
};

export const clearTokens = () => {
  window.localStorage.removeItem("archer.accessToken");
  window.localStorage.removeItem("archer.refreshToken");
};

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const accessToken = getAccessToken();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const body = (await response.json().catch(() => null)) as { data?: T; error?: { message?: string; code?: string } } | null;
  if (!response.ok) {
    throw new ApiError(body?.error?.message ?? "Something went wrong", response.status, body?.error?.code);
  }
  return body?.data as T;
}

async function apiRequestEnvelope<T>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const accessToken = getAccessToken();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> & { error?: { message?: string; code?: string } } | null;
  if (!response.ok) throw new ApiError(body?.error?.message ?? "Something went wrong", response.status, body?.error?.code);
  return { data: body?.data as T, meta: body?.meta };
}

export const api = {
  login: (input: { email: string; password: string }) =>
    apiRequest<{ user: User; accessToken: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  register: (input: { name: string; email: string; password: string; role: UserRole }) =>
    apiRequest<{ user: User; accessToken: string; refreshToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input)
    }),
  me: () => apiRequest<{ user: User }>("/auth/me"),
  logout: () => apiRequest<void>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken: window.localStorage.getItem("archer.refreshToken") })
  }),
  getJobs: (params: { q?: string; currency?: Currency; limit?: number } = {}) => {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.currency) search.set("currency", params.currency);
    if (params.limit) search.set("limit", String(params.limit));
    return apiRequestEnvelope<Job[]>(`/jobs?${search.toString()}`).then(({ data, meta }) => ({ items: data, meta: { total: Number(meta?.total ?? data.length) } }));
  },
  getJob: (id: string) => apiRequest<Job>(`/jobs/${id}`),
  createJob: (input: {
    title: string;
    description: string;
    category?: string;
    budgetAmount: number;
    budgetCurrency: Currency;
    deadline?: string;
    skillIds?: string[];
  }) => apiRequest<Job>("/jobs", { method: "POST", body: JSON.stringify(input) }),
  publishJob: (id: string) => apiRequest<Job>(`/jobs/${id}/publish`, { method: "POST" }),
  getSkills: () => apiRequest<Skill[]>("/skills"),
  createProposal: (input: { jobId: string; coverLetter: string; bidAmount: number; bidCurrency: Currency; estimatedDays?: number }) =>
    apiRequest<Proposal>("/proposals", { method: "POST", body: JSON.stringify(input) }),
  getMyProposals: () => apiRequest<Proposal[]>("/proposals/mine"),
  getReceivedProposals: () => apiRequest<Proposal[]>("/proposals/received"),
  getProposal: (id: string) => apiRequest<Proposal>(`/proposals/${id}`),
  withdrawProposal: (id: string) => apiRequest<Proposal>(`/proposals/${id}/withdraw`, { method: "POST" }),
  acceptProposal: (id: string) => apiRequest<{ project: { id: string; status: string; agreedAmount: number; agreedCurrency: Currency } }>(`/proposals/${id}/accept`, { method: "POST" }),
  rejectProposal: (id: string) => apiRequest<Proposal>(`/proposals/${id}/reject`, { method: "POST" }),
  getNotifications: () => apiRequestEnvelope<Notification[]>("/notifications").then(({ data, meta }) => ({ items: data, unread: Number(meta?.unread ?? 0) })),
  markNotificationRead: (id: string) => apiRequest<Notification>(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () => apiRequest<void>("/notifications/read-all", { method: "POST" }),
  getProjects: () => apiRequest<Project[]>("/projects"),
  getProject: (id: string) => apiRequest<Project>(`/projects/${id}`),
  updateProjectStatus: (id: string, status: Project["status"]) => apiRequest<Project>(`/projects/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  createMilestone: (id: string, input: { title: string; description?: string; amount: number; currency: Currency; dueDate?: string }) => apiRequest<Milestone>(`/projects/${id}/milestones`, { method: "POST", body: JSON.stringify(input) }),
  updateMilestone: (projectId: string, milestoneId: string, input: Partial<Pick<Milestone, "title" | "description" | "amount" | "currency" | "dueDate" | "status">>) => apiRequest<Milestone>(`/projects/${projectId}/milestones/${milestoneId}`, { method: "PATCH", body: JSON.stringify(input) }),
  sendMessage: (id: string, body: string) => apiRequest<Message>(`/projects/${id}/messages`, { method: "POST", body: JSON.stringify({ body }) }),
  markProjectMessagesRead: (id: string) => apiRequest<void>(`/projects/${id}/messages/read`, { method: "POST" })
};

export type { ApiEnvelope };
