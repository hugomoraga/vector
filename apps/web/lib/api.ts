import { auth } from '@/lib/firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RequestOptions {
  method?: string;
  body?: unknown;
}

async function getIdToken(): Promise<string | null> {
  if (!auth) return null;
  try {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const idToken = await getIdToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.data ?? data;
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      request('/api/auth/register', { method: 'POST', body: { email, password } }),
    login: (idToken: string) =>
      request('/api/auth/login', { method: 'POST', body: { idToken } }),
  },

  routines: {
    list: () => request<any[]>('/api/routines'),
    get: (id: string) => request<any>(`/api/routines/${id}`),
    create: (data: any) => request<any>('/api/routines', { method: 'POST', body: data }),
    update: (id: string, data: any) => request<any>(`/api/routines/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => request<void>(`/api/routines/${id}`, { method: 'DELETE' }),
  },

  backlog: {
    list: (params?: { status?: string; priority?: string }) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/api/backlog${query}`);
    },
    get: (id: string) => request<any>(`/api/backlog/${id}`),
    create: (data: any) => request<any>('/api/backlog', { method: 'POST', body: data }),
    update: (id: string, data: any) => request<any>(`/api/backlog/${id}`, { method: 'PUT', body: data }),
    delete: (id: string) => request<void>(`/api/backlog/${id}`, { method: 'DELETE' }),
  },

  dailyItems: {
    list: (date?: string) => request<any[]>(`/api/daily-items${date ? `?date=${date}` : ''}`),
    update: (id: string, status: string) => request<any>(`/api/daily-items/${id}`, { method: 'PATCH', body: { status } }),
    promote: (backlogId: string, date?: string, slot?: string) =>
      request<any>(`/api/daily-items/promote/${backlogId}`, { method: 'POST', body: { date, slot } }),
  },

  settings: {
    get: () => request<any>('/api/settings'),
    update: (data: any) => request<any>('/api/settings', { method: 'PUT', body: data }),
  },
};