import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setToken } from '../services/api/tokenManager';

type UserRole = 'faculty' | 'vetter';

interface User {
    id: string;
    regNo: string;
    name: string;
    roles: UserRole[];
}

interface AuthState {
    user: User | null;
    token: string | null;
    currentRole: UserRole | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (regNo: string, password: string, role: UserRole) => Promise<void>;
    logout: () => Promise<void>;
    setCurrentRole: (role: UserRole) => void;
    clearError: () => void;
    hydrate: () => Promise<void>;
}

// Default demo user — no login needed
const DEMO_USER: User = {
    id: '1',
    regNo: '123456',
    name: 'Demo User',
    roles: ['faculty', 'vetter'],
};

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    currentRole: null,
    isLoading: false,
    error: null,

    // Login is kept as a no-op for API compatibility but auto-succeeds
    login: async (_regNo: string, _password: string, role: UserRole) => {
        set({
            user: DEMO_USER,
            token: 'demo-token',
            currentRole: role,
            isLoading: false,
            error: null,
        });
        setToken('demo-token');
        await AsyncStorage.setItem('user_role', role);
    },

    logout: async () => {
        await AsyncStorage.removeItem('user_role');
        setToken(null);
        set({
            user: null,
            token: null,
            currentRole: null,
            error: null,
        });
    },

    setCurrentRole: (role: UserRole) => {
        // Set user + token immediately so navigators see an authenticated state
        setToken('demo-token');
        set({
            user: DEMO_USER,
            token: 'demo-token',
            currentRole: role,
        });
        AsyncStorage.setItem('user_role', role);
    },

    clearError: () => {
        set({ error: null });
    },

    hydrate: async () => {
        try {
            const role = await AsyncStorage.getItem('user_role') as UserRole | null;

            if (role) {
                // Restore role from storage — auto-authenticate
                setToken('demo-token');
                set({
                    user: DEMO_USER,
                    token: 'demo-token',
                    currentRole: role,
                });
            }
        } catch (e) {
            console.error('Failed to hydrate auth state', e);
        }
    }
}));
