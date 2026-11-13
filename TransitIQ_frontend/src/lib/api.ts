
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

export type Row = Record<string, any>;

export type ListResult<T = Row> = {
  items: T[];
  total: number;
  raw: unknown;
};

export function unwrapList<T = Row>(payload: any): ListResult<T> {
  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length, raw: payload };
  }

  if (payload && typeof payload === 'object') {
    const candidates = [
      payload.items,
      payload.results,
      payload.data,
      payload.records,
      payload.students,
      payload.buses,
      payload.routes,
      payload.assignments,
      payload.events,
      payload.attendance,
      payload.notifications,
      payload.exceptions,
    ];

    const items = candidates.find(Array.isArray);

    if (items) {
      const totalValue = Number(
        payload.total ??
        payload.count ??
        payload.total_count ??
        payload.pagination?.total ??
        items.length
      );

      return {
        items,
        total: Number.isFinite(totalValue) ? totalValue : items.length,
        raw: payload,
      };
    }

    // Handle APIs that return a nested results object.
    if (payload.results && typeof payload.results === 'object') {
      const nested = unwrapList<T>(payload.results);
      if (nested.items.length) return nested;
    }
  }

  return { items: [], total: 0, raw: payload };
}

export const endpoints = {
  health: () => api.get('/health').then(r => r.data),

  dashboard: () => api.get('/dashboard').then(r => r.data),

  students: (params: Record<string, unknown> = {}) =>
    api.get('/students', { params }).then(r => r.data),

  student: (id: string) =>
    api.get(`/students/${encodeURIComponent(id)}`).then(r => r.data),

  buses: (params: Record<string, unknown> = {}) =>
    api.get('/buses', { params }).then(r => r.data),

  routes: (params: Record<string, unknown> = {}) =>
    api.get('/routes', { params }).then(r => r.data),

  assignments: (params: Record<string, unknown> = {}) =>
    api.get('/assignments', { params }).then(r => r.data),

  attendance: (params: Record<string, unknown> = {}) =>
    api.get('/attendance', { params }).then(r => r.data),

  notifications: (params: Record<string, unknown> = {}) =>
    api.get('/notifications', { params }).then(r => r.data),

  exceptions: () => api.get('/exceptions').then(r => r.data),
};

export function field(row: Row, ...keys: string[]): any {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null) {
      return row[key];
    }
  }
  return undefined;
}

export function display(value: any, fallback = '—'): string {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail ||
      error.message ||
      'Unable to reach the API';
  }

  return error instanceof Error
    ? error.message
    : 'Something went wrong';
}

export default api;
