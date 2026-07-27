import axios from 'axios';

// Create central Axios instance
// baseURL ends with /api, then /v1 is appended so page-level calls
// like api.get('/landing/stats') become .../api/v1/landing/stats.
// This is consistent with axiosInstance which uses /v1/... prefix in service calls.
const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const api = axios.create({
  baseURL: base + '/v1',
  withCredentials: true, // Send HTTP cookies with requests (if any)
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
