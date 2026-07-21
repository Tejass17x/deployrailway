import axios from 'axios';

// Create central Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // Send HTTP cookies with requests (if any)
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
