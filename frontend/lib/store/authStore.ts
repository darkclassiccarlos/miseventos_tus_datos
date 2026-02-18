import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/auth';

interface User {
    id: string;
    email: string;
    full_name: string;
    name?: string; // Alias for full_name used in UI
    is_active: boolean;
    roles: { id: number; name: string }[];
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (data: any) => Promise<void>;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const data = await authApi.login({ email, password });
                    const { access_token } = data;

                    set({ token: access_token, isAuthenticated: true });
                    localStorage.setItem('token', access_token);

                    // Set cookie for middleware
                    document.cookie = `auth-token=${access_token}; path=/; max-age=604800; SameSite=Lax`;

                    await get().checkAuth();

                } catch (error: any) {
                    set({
                        error: error.message || 'Error al iniciar sesión',
                        isLoading: false,
                        isAuthenticated: false
                    });
                    throw error;
                }
            },

            logout: async () => {
                set({ isLoading: true });
                try {
                    await authApi.logout();
                } catch (err) {
                    // Even if backend logout fails, we clear local session
                } finally {
                    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
                    localStorage.removeItem('token');
                    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                }
            },

            register: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    await authApi.register(data);
                    set({ isLoading: false });
                } catch (error: any) {
                    set({
                        error: error.message || 'Error al registrarse',
                        isLoading: false
                    });
                    throw error;
                }
            },

            checkAuth: async () => {
                const token = get().token || localStorage.getItem('token');
                if (!token) {
                    set({ isAuthenticated: false, user: null, isLoading: false });
                    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                    return;
                }

                set({ isLoading: true });
                try {
                    const userData = await authApi.getCurrentUser();
                    // Map full_name to name for UI compatibility
                    const userWithName = { ...userData, name: userData.full_name };
                    set({ user: userWithName, isAuthenticated: true, isLoading: false });

                    // Refresh cookie
                    if (token) {
                        document.cookie = `auth-token=${token}; path=/; max-age=604800; SameSite=Lax`;
                    }

                } catch (error: any) {
                    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
                    localStorage.removeItem('token');
                    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user }),
        }
    )
);
