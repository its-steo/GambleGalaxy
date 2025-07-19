// js/auth.js
export function getAccessToken() {
  return localStorage.getItem("access");
}

export const API_BASE_URL = "http://127.0.0.1:8000/api";  // or your hosted URL
