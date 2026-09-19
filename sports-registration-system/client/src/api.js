import axios from 'axios';

const api = axios.create({ baseURL: '/' });

// 请求拦截：自动附带 JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sports_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截：401 时清除登录态并跳转登录页
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !err.config.url.includes('/api/auth/login')) {
      localStorage.removeItem('sports_token');
      localStorage.removeItem('sports_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
