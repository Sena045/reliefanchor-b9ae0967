import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  clearPasswordRecovery: () => void;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Check URL for recovery marker synchronously before first render
const getInitialRecoveryState = () => {
  if (typeof window === 'undefined') return false;
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const searchParams = new URLSearchParams(window.location.search);

  return (
    hashParams.get('type') === 'recovery' ||
    searchParams.get('type') === 'recovery' ||
    searchParams.get('recovery') === '1'
  );
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(getInitialRecoveryState);

  useEffect(() => {
    const detectPasswordRecoveryFromUrl = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);

      if (hashParams.get('type') === 'recovery' || searchParams.get('type') === 'recovery') return true;
      if (searchParams.get('recovery') === '1') return true;

      return false;
    };

    // Detect recovery on initial load (hash-based or query-param based)
    if (detectPasswordRecoveryFromUrl()) {
      setIsPasswordRecovery(true);
    }

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Some flows emit PASSWORD_RECOVERY, others only SIGNED_IN but still include recovery markers in URL.
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && detectPasswordRecoveryFromUrl())) {
        setIsPasswordRecovery(true);
      }

      if (import.meta.env.DEV) {
        // Helpful for debugging recovery redirects; does not log tokens.
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        // eslint-disable-next-line no-console
        console.log('[auth]', {
          event,
          type: hashParams.get('type') ?? searchParams.get('type'),
          recovery: searchParams.get('recovery'),
          path: window.location.pathname,
        });
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const clearPasswordRecovery = () => {
    setIsPasswordRecovery(false);
    window.history.replaceState(null, '', window.location.pathname);
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl }
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Clear local state immediately
    setUser(null);
    setSession(null);
    setIsPasswordRecovery(false);
    
    // Clear Supabase's local storage (no API call needed)
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // Ignore errors - session may already be invalid
    }
  };

  const resetPassword = async (email: string) => {
    // Use root URL with recovery marker (system-managed URLs don't need manual setup)
    const redirectUrl = `${window.location.origin}/?recovery=1`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isPasswordRecovery, clearPasswordRecovery, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
