import axios from 'axios';

const API_BASE = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Перехватчик запросов: добавляем accessToken из localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Перехватчик ответов: при 401 пробуем обновить токен
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // Нет refresh-токена – выходим
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location = '/'; // перенаправление на страницу входа (упрощённо)
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE}/api/auth/refresh`, {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Повторяем исходный запрос с новым accessToken
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Ошибка обновления – очищаем токены и перенаправляем на вход
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location = '/';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;