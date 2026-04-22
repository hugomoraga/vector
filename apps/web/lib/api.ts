import { auth } from '@/lib/firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RequestOptions {
  method?: string;
  body?: unknown;
}

async function getIdToken(forceRefresh = false): Promise<string | null> {
  if (!auth) return null;
  try {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken(forceRefresh);
    }
    return null;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const body = options.body ? JSON.stringify(options.body) : undefined;
  const method = options.method || 'GET';

  const fetchOnce = (token: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(`${API_URL}${endpoint}`, { method, headers, body });
  };

  let idToken = await getIdToken(false);
  let response = await fetchOnce(idToken);

  // Stale session after tab sleep, etc.: one forced refresh before surfacing 401
  if (response.status === 401 && idToken) {
    const refreshed = await getIdToken(true);
    if (refreshed) {
      response = await fetchOnce(refreshed);
    }
  }

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
    createTelegramLink: () =>
      request<{ deepLink: string; expiresInSeconds: number; linkVersion: number }>(
        '/api/settings/telegram-link',
        { method: 'POST' },
      ),
  },
};