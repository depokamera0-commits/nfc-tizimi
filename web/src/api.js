const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const request = async (path, { method = "GET", token, body } = {}) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.message || "Request failed.";
    const details = errorBody.errors || [];
    const error = new Error(message);
    error.details = details;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

export const login = (cardId, pin) =>
  request("/auth/login", {
    method: "POST",
    body: { cardId, pin },
  });

export const getProfile = (token) => request("/me", { token });

export const getEmployees = (token) => request("/employees", { token });

export const createEmployee = (token, payload) =>
  request("/employees", { method: "POST", token, body: payload });

export { API_URL };
