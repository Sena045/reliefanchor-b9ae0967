import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { pushNotificationService } from "./services/pushNotificationService";

// Initialize Sentry for error tracking
initSentry();

// Initialize push notifications
pushNotificationService.init();

// Register service worker immediately for PWA compatibility
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('SW registration failed:', error);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
