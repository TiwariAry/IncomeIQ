// src/api.js
import axios from 'axios';

// 1. The In-Memory Variable (Safe from XSS)
let inMemoryAccessToken = null;

// 2. A setter function so App.jsx can update this variable after login
export const setAccessToken = (token) => {
    inMemoryAccessToken = token;
};

// 3. Create the Axios instance
const api = axios.create({
    baseURL: 'http://localhost:3000/api/v1', // Ensure this matches your backend port
    headers: {
        'Content-Type': 'application/json',
    },
});

// 4. Automatically attach the in-memory token to every outgoing request
api.interceptors.request.use((config) => {
    if (inMemoryAccessToken) {
        config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
});

// 5. Handle expired tokens (401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token died or session invalid. Wipe memory.
            inMemoryAccessToken = null;
            // You can trigger a UI logout event here if needed
        }
        return Promise.reject(error);
    }
);

export default api;