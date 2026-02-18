import { api, API_CONFIG } from './api';

export const authService = {
    login: async (email: string, password: string, role: 'faculty' | 'vetter') => {
        // Check if backend is reachable
        try {
            await api.get('/'); // or /health if available
        } catch (e) {
            console.warn('Backend connectivity check failed', e);
            // For prototype, we might want to allow login even if backend is down? 
            // User request says "validates against backend health".
            // But let's proceed to try actual login key exchange if backend was ready.
        }

        // For prototype/mock Auth (if backend doesn't have fully working auth yet)
        // We can simulate a successful login if credentials match a hardcoded set
        // OR we can try to hit the real endpoint if it exists.

        // Attempt real login first
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.LOGIN, {
                username: email,
                password: password
            }, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            return response.data;
        } catch (error) {
            // If real login fails, fallback to mock for demo purposes if needed
            // But 'authStore' already handles the API call directly in the updated store...
            // Wait, the user asked to "Update Service Layer" to handle all API communication.
            // The store currently calls 'api.post' directly. 
            // Ideally, the store should call 'authService.login'.

            // I will implement the real network call here so stores can be refactored to use this service later
            // or if I update them now (but user only asked to update service layer files in this step).
            throw error;
        }
    },

    logout: async () => {
        try {
            await api.post(API_CONFIG.ENDPOINTS.LOGOUT);
        } catch (error) {
            console.warn('Logout failed', error);
        }
    },

    checkHealth: async () => {
        try {
            await api.get('/');
            return true;
        } catch (error) {
            return false;
        }
    },
};
