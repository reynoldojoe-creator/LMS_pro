import axios, { AxiosError, AxiosInstance } from 'axios';
import { API_CONFIG } from './config';
import { getToken, triggerLogout } from './tokenManager';

// Custom error class for API errors
export class APIError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'APIError';
    }
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUTS.DEFAULT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Add auth token if available
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Log requests in development
        if (__DEV__) {
            console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        // Log responses in development
        if (__DEV__) {
            console.log(
                `[API Response] ${response.status} ${response.config.url}`
            );
        }
        return response;
    },
    (error: AxiosError) => {
        // Handle 401 Unauthorized - logout user
        if (error.response?.status === 401) {
            triggerLogout();
        }

        // Log errors in development
        if (__DEV__) {
            console.error(
                `[API Error] ${error.response?.status} ${error.config?.url}:`,
                error.message
            );
        }

        // Transform to Custom APIError
        if (error.response) {
            throw new APIError(
                error.response.status,
                (error.response.data as any)?.detail || error.message,
                error.response.data
            );
        }

        // Network or other errors
        throw new APIError(
            0,
            error.message || 'Network Error',
            { originalError: error }
        );
    }
);

export default apiClient;
