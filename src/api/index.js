import axios from "axios";
import { useAuthStore } from "../stores/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Добавляем токен в каждый запрос
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Перехватываем 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Если 401 и запрос не повторялся – пробуем обновить токен
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Ставим запрос в очередь
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        // Нет рефреш-токена – выходим
        const authStore = useAuthStore();
        authStore.logout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {
            refreshToken: refreshToken,
          },
        );
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        // Сохраняем новые токены
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", newRefreshToken);

        // Обновляем токен в Pinia сторе (если нужно)
        const authStore = useAuthStore();
        if (authStore.user) {
          // Можно дополнительно обновить данные пользователя, если они изменились
        }

        processQueue(null, accessToken);
        // Повторяем исходный запрос с новым токеном
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Если обновить не удалось – очищаем всё и редиректим на логин
        processQueue(refreshError, null);
        const authStore = useAuthStore();
        authStore.logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Если ошибка не 401 или запрос уже был повторён – просто пробрасываем
    return Promise.reject(error);
  },
);

export default api;
