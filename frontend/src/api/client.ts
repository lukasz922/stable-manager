import axios, { AxiosError } from "axios";

type BackendErrorResponse = {
  detail?: string | Array<{ msg?: string }>;
  message?: string;
};

export const api = axios.create({
  baseURL: "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("stable_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<BackendErrorResponse>) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401) {
      localStorage.removeItem("stable_token");
      delete api.defaults.headers.common.Authorization;
    }

    let message = "Wystąpił błąd podczas komunikacji z serwerem.";

    if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      const validationMessages = data.detail
        .map((item) => item?.msg)
        .filter((item): item is string => Boolean(item));

      if (validationMessages.length > 0) {
        message = validationMessages.join("\n");
      }
    } else if (typeof data?.message === "string") {
      message = data.message;
    } else if (error.message) {
      message = error.message;
    }

    const normalizedError = new Error(message);
    Object.assign(normalizedError, {
      status,
      originalError: error,
    });

    return Promise.reject(normalizedError);
  },
);