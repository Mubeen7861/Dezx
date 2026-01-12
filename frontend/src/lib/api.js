import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// Users API
export const usersAPI = {
  list: (params) => api.get('/users/', { params }),
  get: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  block: (id) => api.put(`/users/${id}/block`),
  feature: (id) => api.put(`/users/${id}/feature`),
  delete: (id) => api.delete(`/users/${id}`),
};

// Site Content API
export const contentAPI = {
  get: () => api.get('/content/'),
  update: (data) => api.put('/content/', data),
  init: () => api.post('/content/init'),
};

// Projects API
export const projectsAPI = {
  list: (params) => api.get('/projects/', { params }),
  my: () => api.get('/projects/my'),
  featured: () => api.get('/projects/featured'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects/', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  close: (id) => api.put(`/projects/${id}/close`),
  feature: (id) => api.put(`/projects/${id}/feature`),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Competitions API
export const competitionsAPI = {
  list: (params) => api.get('/competitions/', { params }),
  my: () => api.get('/competitions/my'),
  featured: () => api.get('/competitions/featured'),
  get: (id) => api.get(`/competitions/${id}`),
  create: (data) => api.post('/competitions/', data),
  update: (id, data) => api.put(`/competitions/${id}`, data),
  feature: (id) => api.put(`/competitions/${id}/feature`),
  delete: (id) => api.delete(`/competitions/${id}`),
};

// Proposals API
export const proposalsAPI = {
  forProject: (projectId) => api.get(`/proposals/project/${projectId}`),
  my: () => api.get('/proposals/my'),
  all: () => api.get('/proposals/all'),
  create: (data) => api.post('/proposals/', data),
  approve: (id) => api.put(`/proposals/${id}/approve`),
  reject: (id) => api.put(`/proposals/${id}/reject`),
  delete: (id) => api.delete(`/proposals/${id}`),
};

// Submissions API
export const submissionsAPI = {
  forCompetition: (competitionId) => api.get(`/submissions/competition/${competitionId}`),
  my: () => api.get('/submissions/my'),
  all: () => api.get('/submissions/all'),
  create: (data) => api.post('/submissions/', data),
  update: (id, data) => api.put(`/submissions/${id}`, data),
  approve: (id) => api.put(`/submissions/${id}/approve`),
  reject: (id) => api.put(`/submissions/${id}/reject`),
  setWinner: (id, position) => api.put(`/submissions/${id}/winner?position=${position}`),
  removeWinner: (id) => api.put(`/submissions/${id}/remove-winner`),
  delete: (id) => api.delete(`/submissions/${id}`),
};

// Notifications API
export const notificationsAPI = {
  list: (params) => api.get('/notifications/', { params }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  broadcast: (message, link) => api.post('/notifications/broadcast', { message, link }),
  sendToUser: (to_user_id, message, link) => api.post('/notifications/send-to-user', { to_user_id, message, link }),
  sendToRole: (role, message, link) => api.post('/notifications/send-to-role', { role, message, link }),
};

// Upload API
export const uploadAPI = {
  upload: (file, folder = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return api.post('/upload/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  delete: (filePath) => api.delete('/upload/', { params: { file_path: filePath } }),
};

// Admin API
export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  recentActivity: () => api.get('/admin/recent-activity'),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings/'),
  update: (data) => api.put('/settings/', data),
  init: () => api.post('/settings/init'),
};

// Audit API
export const auditAPI = {
  list: (params) => api.get('/audit/', { params }),
};
