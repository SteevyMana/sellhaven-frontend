import axios from "axios";

/*const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://backend.test/api",
  headers: {
    Accept: "application/json",
  },
});*/

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("VITE_API_URL is not configured");
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
  },  
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;