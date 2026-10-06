import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const ACCESS_KEY = 'archer.accessToken';
const REFRESH_KEY = 'archer.refreshToken';

export type Currency = 'USD' | 'MMK';
export type UserRole = 'CLIENT' | 'FREELANCER' | 'ADMIN';
export type Profile = { id: string; userId: string; name: string; headline?: string | null; bio?: string | null; avatarUrl?: string | null; location?: string | null };
export type User = { id: string; email: string; role: UserRole; status: string; profile: Profile | null };
export type Job = {
  id: string; title: string; description: string; category: string | null; budgetAmount: number; budgetCurrency: Currency;
  status: string; deadline: string | null; createdAt: string; publishedAt: string | null;
  client: { id: string; profile: { name: string; avatarUrl: string | null } | null };
  skills: { skill: { id: string; name: string; slug: string } }[];
};
export type Proposal = {
  id: string; coverLetter: string; bidAmount: number; bidCurrency: Currency; estimatedDays: number | null;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'; createdAt: string;
  freelancer: { id: string; email: string; profile: Profile | null };
  job: { id: string; title: string; description: string; budgetAmount: number; budgetCurrency: Currency; status: string; clientId: string; client: { id: string; email: string; profile: Profile | null } };
};
export type Project = {
  id: string; clientId: string; freelancerId: string; agreedAmount: number; agreedCurrency: Currency;
  status: 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'; createdAt: string;
  job: { id: string; title: string; description: string; deadline: string | null };
  client: { id: string; email: string; profile: Profile | null }; freelancer: { id: string; email: string; profile: Profile | null };
  milestones: { id: string; title: string; description: string | null; amount: number; currency: Currency; dueDate: string | null; status: string }[];
  conversation?: { id: string; messages: Message[] } | null;
};
export type Message = { id: string; senderId: string; body: string; createdAt: string; sender: { id: string; email: string; profile: Profile | null } };
export type Notification = { id: string; type: string; title: string; payload: string | null; readAt: string | null; createdAt: string };

type Envelope<T> = { data: T; meta?: Record<string, unknown> };
export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) { super(message); this.name = 'ApiError'; }
}

export const tokenStore = {
  getAccess: () => SecureStore.getItemAsync(ACCESS_KEY),
  getRefresh: () => SecureStore.getItemAsync(REFRESH_KEY),
  save: async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync(ACCESS_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
  },
  clear: async () => { await SecureStore.deleteItemAsync(ACCESS_KEY); await SecureStore.deleteItemAsync(REFRESH_KEY); }
};

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const accessToken = await tokenStore.getAccess();
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  let response: Response;
  try { response = await fetch(`${API_URL}${path}`, { ...init, headers }); }
  catch { throw new ApiError('Unable to reach Archer. Check your connection and try again.', 0, 'NETWORK_ERROR'); }

  if (response.status === 401 && retry && path !== '/auth/login' && path !== '/auth/register' && path !== '/auth/refresh') {
    const refreshToken = await tokenStore.getRefresh();
    if (refreshToken) {
      const refreshed = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) }).catch(() => null);
      const result = await refreshed?.json().catch(() => null) as Envelope<{ accessToken: string; refreshToken: string }> | null;
      if (refreshed?.ok && result?.data) {
        await tokenStore.save(result.data.accessToken, result.data.refreshToken);
        return request<T>(path, init, false);
      }
    }
    await tokenStore.clear();
  }

  const body = await response.json().catch(() => null) as (Envelope<T> & { error?: { message?: string; code?: string } }) | null;
  if (!response.ok) throw new ApiError(body?.error?.message ?? 'Something went wrong. Please try again.', response.status, body?.error?.code);
  return body?.data as T;
}
const params = (values: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== '') search.set(key, String(value)); });
  return search.size ? `?${search.toString()}` : '';
};

export const api = {
  login: (input: { email: string; password: string }) => request<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  register: (input: { name: string; email: string; password: string; role: UserRole }) => request<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  me: () => request<{ user: User }>('/auth/me'),
  updateProfile: (input: { name?: string; headline?: string | null; bio?: string | null; location?: string | null }) => request<Profile>('/users/me/profile', { method: 'PATCH', body: JSON.stringify(input) }),
  logout: async () => request<void>('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken: await tokenStore.getRefresh() }) }),
  getJobs: (q?: string) => request<Job[]>(`/jobs${params({ q, limit: 50 })}`),
  getJob: (id: string) => request<Job>(`/jobs/${id}`),
  createJob: (input: { title: string; description: string; category?: string; budgetAmount: number; budgetCurrency: Currency; deadline?: string }) => request<Job>('/jobs', { method: 'POST', body: JSON.stringify(input) }),
  publishJob: (id: string) => request<Job>(`/jobs/${id}/publish`, { method: 'POST' }),
  createProposal: (input: { jobId: string; coverLetter: string; bidAmount: number; bidCurrency: Currency; estimatedDays?: number }) => request<Proposal>('/proposals', { method: 'POST', body: JSON.stringify(input) }),
  getProposals: (role: UserRole) => request<Proposal[]>(role === 'CLIENT' ? '/proposals/received' : '/proposals/mine'),
  getProposal: (id: string) => request<Proposal>(`/proposals/${id}`),
  acceptProposal: (id: string) => request<{ project: Project }>(`/proposals/${id}/accept`, { method: 'POST' }),
  rejectProposal: (id: string) => request<Proposal>(`/proposals/${id}/reject`, { method: 'POST' }),
  withdrawProposal: (id: string) => request<Proposal>(`/proposals/${id}/withdraw`, { method: 'POST' }),
  getProjects: () => request<Project[]>('/projects'),
  getProject: (id: string) => request<Project>(`/projects/${id}`),
  updateProjectStatus: (id: string, status: Project['status']) => request<Project>(`/projects/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  createMilestone: (id: string, input: { title: string; description?: string; amount: number; currency: Currency; dueDate?: string }) => request<Project['milestones'][number]>(`/projects/${id}/milestones`, { method: 'POST', body: JSON.stringify(input) }),
  updateMilestone: (projectId: string, milestoneId: string, input: { status: string }) => request<Project['milestones'][number]>(`/projects/${projectId}/milestones/${milestoneId}`, { method: 'PATCH', body: JSON.stringify(input) }),
  sendMessage: (id: string, body: string) => request<Message>(`/projects/${id}/messages`, { method: 'POST', body: JSON.stringify({ body }) }),
  markProjectMessagesRead: (id: string) => request<void>(`/projects/${id}/messages/read`, { method: 'POST' }),
  getNotifications: () => request<Notification[]>('/notifications'),
  markNotificationRead: (id: string) => request<Notification>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request<void>('/notifications/read-all', { method: 'POST' })
};
