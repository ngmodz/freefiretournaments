import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import './ios-font.css'
import './index.css'
import { registerServiceWorker } from './registerSW'
import TournamentCleanupService from './lib/tournamentCleanupService'
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"

// Initialize tournament cleanup service
TournamentCleanupService.initializeCleanup();

// Start aggressive cleanup mode for faster deletion
TournamentCleanupService.startAggressiveCleanup();

// Start ultra-aggressive cleanup mode for immediate deletion
TournamentCleanupService.startUltraAggressiveCleanup();

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <SpeedInsights />
      <Analytics />
    </AuthProvider>
  </BrowserRouter>
);

registerServiceWorker();
