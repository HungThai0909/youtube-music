import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

function parseJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(b64);
    try {
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  } catch (e) {
    return null;
  }
}

const plainAxios = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

instance.interceptors.request.use(async (config) => {
  const accessToken = localStorage.getItem("access_token");
  if (accessToken) {
    try {
      const payload = parseJwtPayload(accessToken);
      const now = Math.floor(Date.now() / 1000);
      const threshold = 30; 
      if (payload && payload.exp && payload.exp - now < threshold) {
        if (!refreshPromise) {
          refreshPromise = getNewToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        if (newToken && newToken.access_token) {
          localStorage.setItem("access_token", newToken.access_token);
          if (newToken.refresh_token)
            localStorage.setItem("refresh_token", newToken.refresh_token);
        } else {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("currentUser");
        }
      }
    } catch (e) {
    }
    const tokenNow = localStorage.getItem("access_token");
    if (tokenNow) config.headers.Authorization = `Bearer ${tokenNow}`;
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
    const response = await plainAxios.post("/auth/refresh-token", {
      refreshToken,
    });
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
        try {
          window.location.href = "/login";
        } catch (e) {}
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;
