import { Route, Routes, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import TournamentDetails from "./pages/TournamentDetails";
import TournamentCreate from "./pages/TournamentCreate";
import Tournaments from "./pages/Tournaments";
import HostedTournaments from "./pages/HostedTournaments";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import TermsAndPolicy from "./pages/TermsAndPolicy";
import Layout from "./components/Layout";
import PWALayoutWrapper from "./components/PWALayoutWrapper";
import ProtectedRoute from "./components/ProtectedRoute";
import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "./components/ui/sonner";
import Landing from "./pages/Landing";
import { useAuth } from "./contexts/AuthContext";
import { TournamentProvider } from "./contexts/TournamentContext";
import Wallet from "./pages/Wallet";
import Credits from "./pages/Credits";
import PaymentStatus from "./pages/PaymentStatus";
// Admin pages
import AdminPage from "./pages/admin/withdrawals";
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
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/tournament/create" element={
              <ProtectedRoute>
                <TournamentCreate />
              </ProtectedRoute>
            } />
            <Route path="/tournament/:id" element={
              <ProtectedRoute>
                <TournamentDetails />
              </ProtectedRoute>
            } />
            <Route path="/tournaments" element={
              <ProtectedRoute>
                <Tournaments />
              </ProtectedRoute>
            } />
            <Route path="/wallet" element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            } />
            {/* Credits routes - available at multiple paths */}
            <Route path="/credits" element={
              <ProtectedRoute>
                <Credits />
              </ProtectedRoute>
            } />
            <Route path="/packages" element={
              <ProtectedRoute>
                <Credits />
              </ProtectedRoute>
            } />
            <Route path="/subscription" element={
              <ProtectedRoute>
                <Credits />
              </ProtectedRoute>
            } />
            <Route path="/buy-credits" element={
              <ProtectedRoute>
                <Credits />
              </ProtectedRoute>
            } />
            {/* Payment status page */}
            <Route path="/payment-status" element={
              <ProtectedRoute>
                <PaymentStatus />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/terms-and-privacy" element={<TermsAndPolicy />} />
          </Route>
          
          {/* Admin routes - separate from main layout */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />
          
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
