import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh });
        localStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register/', data),
  login: (data) => api.post('/auth/login/', data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  profile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
};

// Applications
export const jobsAPI = {
  list: (params) => api.get('/applications/', { params }),
  get: (id) => api.get(`/applications/${id}/`),
  create: (data) => api.post('/applications/', data),
  update: (id, data) => api.put(`/applications/${id}/`, data),
  patch: (id, data) => api.patch(`/applications/${id}/`, data),
  delete: (id) => api.delete(`/applications/${id}/`),
  updateStatus: (id, status) => api.patch(`/applications/${id}/update_status/`, { status }),
  dashboard: () => api.get('/applications/dashboard/'),
};

// Interviews
export const interviewsAPI = {
  list: (params) => api.get('/interviews/', { params }),
  create: (data) => api.post('/interviews/', data),
  update: (id, data) => api.patch(`/interviews/${id}/`, data),
  delete: (id) => api.delete(`/interviews/${id}/`),
  upcoming: () => api.get('/interviews/upcoming/'),
};

// Tags
export const tagsAPI = {
  list: () => api.get('/tags/'),
  create: (data) => api.post('/tags/', data),
  delete: (id) => api.delete(`/tags/${id}/`),
};

export default api;
