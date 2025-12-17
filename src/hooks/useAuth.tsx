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

  // Dedicated landing path for recovery
  if (window.location.pathname === '/reset-password') return true;

  return (
    hashParams.get('type') === 'recovery' ||
    searchParams.get('type') === 'recovery' ||
    searchParams.get('recovery') === '1' ||
    searchParams.get('mode') === 'recovery'
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

      if (window.location.pathname === '/reset-password') return true;

      // Primary: GoTrue adds type=recovery
      if (hashParams.get('type') === 'recovery' || searchParams.get('type') === 'recovery') return true;

      // Secondary: our own marker to make the flow robust across providers/configs
      if (searchParams.get('recovery') === '1' || searchParams.get('mode') === 'recovery') return true;

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
    // If the user landed on /reset-password, bring them back to the app root.
    const nextPath = window.location.pathname === '/reset-password' ? '/' : window.location.pathname;
    window.history.replaceState(null, '', nextPath);
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
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    // Use a dedicated landing path so the app can reliably show the reset form.
    const redirectUrl = `${window.location.origin}/reset-password?recovery=1`;
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
