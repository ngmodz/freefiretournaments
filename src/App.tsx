import { Route, Routes, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import TournamentDetails from "./pages/TournamentDetails";
import TournamentCreate from "./pages/TournamentCreate";
import Tournaments from "./pages/Tournaments";
import HostedTournaments from "./pages/HostedTournaments";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import TermsAndPolicy from "./pages/TermsAndPolicy";
import Layout from "./components/Layout";
import PWALayoutWrapper from "./components/PWALayoutWrapper";
import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "./components/ui/sonner";
import Landing from "./pages/Landing";
import { useAuth } from "./contexts/AuthContext";
import { TournamentProvider } from "./contexts/TournamentContext";
import Wallet from "./pages/Wallet";
import "./App.css";

function App() {
  const { currentUser } = useAuth();

  return (
    <PWALayoutWrapper>
      <TournamentProvider>
        <Routes>
          {/* Landing page redirects based on auth status */}
          <Route path="/" element={<Landing />} />
          
          {/* Auth page - redirects to home if already logged in */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected routes inside main layout */}
          <Route element={<Layout />}>
            <Route path="/home" element={
              currentUser ? <Index /> : <Navigate to="/auth" replace />
            } />
            <Route path="/tournament/create" element={<TournamentCreate />} />
            <Route path="/tournament/:id" element={<TournamentDetails />} />
            <Route path="/tournaments" element={
              currentUser ? <Tournaments /> : <Navigate to="/auth" replace />
            } />
            <Route path="/wallet" element={
              currentUser ? <Wallet /> : <Navigate to="/auth" replace />
            } />
            <Route path="/profile" element={<Navigate to="/settings" replace />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/terms-and-privacy" element={<TermsAndPolicy />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
        <SonnerToaster 
          position="top-center" 
          theme="dark"
          className="custom-sonner-toaster" 
          closeButton 
          richColors 
          expand={false}
          toastOptions={{
            duration: 4000,
          }}
        />
      </TournamentProvider>
    </PWALayoutWrapper>
  );
}

export default App;
