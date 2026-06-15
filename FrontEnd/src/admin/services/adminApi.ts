import { api } from '../../api/client';

// ─── User Account API ─────────────────────────────────────
export const userApi = {
  getAll: () => api.get('/admin/roles').then(r => r.data),
  create: (user: object) => api.post('/admin/roles', user).then(r => r.data),
  update: (id: string, user: object) => api.put(`/admin/roles/${id}`, user).then(r => r.data),
  remove: (id: string) => api.delete(`/admin/roles/${id}`),
};

// ─── Learning Path API ────────────────────────────────────
export const learningPathApi = {
  getAll: () => api.get('/admin/learning-paths').then(r => r.data),
  getById: (id: string) => api.get(`/admin/learning-paths/${id}`).then(r => r.data),
  create: (path: object) => api.post('/admin/learning-paths', path).then(r => r.data),
  update: (id: string, path: object) => api.put(`/admin/learning-paths/${id}`, path).then(r => r.data),
  remove: (id: string) => api.delete(`/admin/learning-paths/${id}`),
};

// ─── Course API ───────────────────────────────────────────
export const courseApi = {
  getAll: () => api.get('/admin/courses').then(r => r.data),
  getById: (id: string) => api.get(`/admin/courses/${id}`).then(r => r.data),
  remove: (id: string) => api.delete(`/admin/courses/${id}`),
};
