import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.fcd4627f03114bf983be901284e1a5ab',
  appName: 'reliefanchor',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '1090858217638-nnvgd4fv29k0t69qcv5j8h0c8l8k2f3e.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
  // Note: For development with hot-reload, uncomment the server block below:
  // server: {
  //   url: 'https://fcd4627f-0311-4bf9-83be-901284e1a5ab.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // }
};

export default config;
