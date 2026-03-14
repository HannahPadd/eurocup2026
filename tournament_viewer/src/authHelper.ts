import axios from "axios";

let getToken: (() => string | null) | null = null;

export const registerAuthTokenGetter = (fn: () => string | null) => {
  getToken = fn;
};

axios.interceptors.request.use((config) => {
  const token = getToken?.();

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});