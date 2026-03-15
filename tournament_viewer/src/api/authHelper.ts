import axios from "axios";

let getToken: (() => string | null) | null = null;
let onLogout: (() => void) | null = null;


export const registerAuthTokenGetter = (fn: () => string | null) => {
  getToken = fn;
};

export const registerLogoutHandler = (fn: () => void) => {
  onLogout = fn;
};

axios.interceptors.request.use((config) => {
  const token = getToken?.();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onLogout) {
      onLogout();
    }
    return Promise.reject(error);
  }
);