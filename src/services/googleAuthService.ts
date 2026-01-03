import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

// Dynamically import the Google Auth plugin only on native platforms
let GoogleAuth: typeof import('@codetrix-studio/capacitor-google-auth').GoogleAuth | null = null;

export const initGoogleAuth = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const module = await import('@codetrix-studio/capacitor-google-auth');
      GoogleAuth = module.GoogleAuth;
      
      // Initialize with your Google Client ID
      // You'll need to add your Web Client ID from Google Cloud Console
      await GoogleAuth.initialize({
        clientId: '1090858217638-nnvgd4fv29k0t69qcv5j8h0c8l8k2f3e.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
      
      console.log('Google Auth initialized for native platform');
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
    }
  }
};

export const signInWithGoogleNative = async (): Promise<{ error: Error | null }> => {
  if (!Capacitor.isNativePlatform()) {
    // Fall back to web OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error: error as Error | null };
  }

  if (!GoogleAuth) {
    await initGoogleAuth();
  }

  if (!GoogleAuth) {
    return { error: new Error('Google Auth not available') };
  }

  try {
    // Sign in with native Google Auth
    const googleUser = await GoogleAuth.signIn();
    
    if (!googleUser.authentication?.idToken) {
      return { error: new Error('No ID token received from Google') };
    }

    // Use the ID token to sign in with Supabase
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: googleUser.authentication.idToken,
    });

    return { error: error as Error | null };
  } catch (error) {
    console.error('Google sign-in error:', error);
    
    // Check if user cancelled
    if ((error as Error).message?.includes('canceled') || 
        (error as Error).message?.includes('cancelled')) {
      return { error: null }; // User cancelled, not an error
    }
    
    return { error: error as Error };
  }
};

export const signOutFromGoogle = async () => {
  if (Capacitor.isNativePlatform() && GoogleAuth) {
    try {
      await GoogleAuth.signOut();
    } catch (error) {
      console.error('Google sign out error:', error);
    }
  }
};
