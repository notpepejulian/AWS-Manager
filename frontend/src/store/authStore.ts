import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '../services/apiService';

// ========================================
// TIPOS
// ========================================

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  // Estado
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

// ========================================
// STORE DE AUTENTICACIÓN
// ========================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Acciones
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiService.login(email, password);

          if (response.success && response.data) {
            const { token, user } = response.data;
            
            // Guardar token en localStorage
            localStorage.setItem('authToken', token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Error en el login'
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'Error de conexión'
          });
          return false;
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiService.register({ name, email, password });

          if (response.success && response.data) {
            const { token, user } = response.data;
            
            // Guardar token en localStorage
            localStorage.setItem('authToken', token);
            
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            return true;
          } else {
            set({
              isLoading: false,
              error: response.error || 'Error en el registro'
            });
            return false;
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'Error de conexión'
          });
          return false;
        }
      },

      logout: () => {
        // Limpiar localStorage
        localStorage.removeItem('authToken');
        
        // Limpiar estado
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
          return false;
        }

        set({ isLoading: true });

        try {
          const response = await apiService.getCurrentUser();

          if (response.success && response.data) {
            set({
              user: response.data.user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            return true;
          } else {
            // Token inválido, limpiar estado
            localStorage.removeItem('authToken');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null
            });
            return false;
          }
        } catch (error) {
          // Error de conexión, mantener estado actual
          set({ isLoading: false });
          return get().isAuthenticated; // Mantener estado si ya está autenticado
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage', // nombre para localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// ========================================
// HOOKS ÚTILES
// ========================================

export const useAuth = () => {
  const auth = useAuthStore();
  
  return {
    ...auth,
    // Computed values
    isLoggedIn: auth.isAuthenticated && !!auth.user,
    userName: auth.user?.name || '',
    userEmail: auth.user?.email || ''
  };
};
