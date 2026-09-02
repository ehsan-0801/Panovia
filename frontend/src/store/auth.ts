import { create } from 'zustand';
import { api } from '@/lib/api';
import { SIGNED_OUT_EVENT, type AuthSession, type AuthUser, type StoredAuth, clearAuth, readAuth, writeAuth } from '@/lib/authClient';
import { useSession } from './session';

// Tracks which user the app-session was last loaded for, so repeated auth
// changes (a re-render, a tab refocus) for the same user don't trigger reloads.
let loadedUserId: string | null = null;

interface AuthResponse {
  user: AuthUser;
  session: AuthSession;
}

interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: { email: string; password: string; full_name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => {
  /** Applies a signed-in session and loads the app context behind it. */
  const adopt = async (auth: StoredAuth) => {
    writeAuth(auth);
    set({ user: auth.user, session: auth.session });
    loadedUserId = auth.user.id;
    await useSession.getState().load();
  };

  return {
    user: null,
    session: null,
    loading: true,

    init: async () => {
      const stored = readAuth();
      set({ user: stored?.user ?? null, session: stored?.session ?? null, loading: false });

      // A 401 anywhere in the app clears the stored session; mirror that into
      // the store so the router falls back to the sign-in screen immediately.
      window.addEventListener(SIGNED_OUT_EVENT, () => {
        loadedUserId = null;
        useSession.getState().clear();
        set({ user: null, session: null });
      });

      if (stored) {
        loadedUserId = stored.user.id;
        await useSession.getState().load();
      } else {
        useSession.setState({ loading: false });
      }
    },

    signIn: async (email, password) => {
      const { user, session } = await api.post<AuthResponse>('/auth/login', { email, password });
      await adopt({ user, session });
    },

    signUp: async (payload) => {
      const { user, session } = await api.post<AuthResponse>('/auth/register', payload);
      await adopt({ user, session });
    },

    signOut: async () => {
      try {
        await api.post('/auth/logout');
      } catch {
        // Sign out locally regardless — the token is stateless server-side.
      }
      clearAuth();
      loadedUserId = null;
      useSession.getState().clear();
      set({ user: null, session: null });
    },
  };
});

export const currentUserId = () => loadedUserId;
