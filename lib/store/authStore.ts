import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setCredentials: (session: Session | null, user: User | null) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  session: null,
  user: null,
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    set({ session: data.session, user: data.user });
  },
  signUp: async (username: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) {
      throw error;
    }
    set({ session: data.session, user: data.user });
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    set({ session: null, user: null });
  },
  setCredentials: (session: Session | null, user: User | null) => {
    set({ session, user });
  },
}));
