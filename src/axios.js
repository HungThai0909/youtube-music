import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

instance.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem("access_token");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;
const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("currentUser");
};

const getNewToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;
    const response = await plainAxios.post("/auth/refresh-token", { refreshToken });
    return response.data;
  } catch (err) {
    console.error("Refresh token failed:", err);
    return false;
  }
};

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.log("Axios response error:", error);
    const status = error.response?.status;
    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      if (!refreshPromise) {
        refreshPromise = getNewToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      if (newToken && newToken.access_token) {
        localStorage.setItem("access_token", newToken.access_token);
        if (newToken.refresh_token) {
          localStorage.setItem("refresh_token", newToken.refresh_token);
        }
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken.access_token}`;
        return instance(originalRequest);
      } else {
        logout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;