import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true, // Specific for Sanctum/Laravel
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle global errors (e.g. 401 Unauthorized)
        if (error.response?.status === 401) {
            // Redirect to login or refresh token logic
            console.warn('Unauthorized - redirecting to login');
        }
        return Promise.reject(error);
    }
);

export default api;
