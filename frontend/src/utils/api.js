    import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

// Create a shared axios instance for admin (auth-required) calls
const api = axios.create({
    baseURL: BASE_URL,
});

// ─── REQUEST: auto-attach token ───
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── RESPONSE: auto-handle 401 → try refresh → redirect login ───
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;
        const code = error.response?.data?.code;

        // Only attempt refresh for 401 with TOKEN_EXPIRED code, and only once per request
        if (status === 401 && code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
            
            if (isRefreshing) {
                // Queue this request until refresh finishes
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['x-auth-token'] = token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Try to get a fresh token
                const oldToken = localStorage.getItem('token');
                const res = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
                    headers: { 'x-auth-token': oldToken }
                });
                const newToken = res.data.token;
                localStorage.setItem('token', newToken);

                // Update the original request and retry
                originalRequest.headers['x-auth-token'] = newToken;
                processQueue(null, newToken);

                return api(originalRequest);
            } catch (refreshErr) {
                // Refresh failed — token is beyond recovery
                processQueue(refreshErr, null);
                localStorage.removeItem('token');
                window.location.href = '/login';
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        // For TOKEN_INVALID or any other auth failure, force logout
        if (status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default api;