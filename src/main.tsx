import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { pushNotificationService } from "./services/pushNotificationService";

// Initialize Sentry for error tracking
initSentry();

// Initialize push notifications
pushNotificationService.init();

createRoot(document.getElementById("root")!).render(<App />);
