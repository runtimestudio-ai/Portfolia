import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { PortfolioProvider } from "./contexts/PortfolioContext";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import AIAssistant from "./components/AIAssistant";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Achievements from "./pages/Achievements";
import Skills from "./pages/Skills";
import PortfolioEditor from "./pages/PortfolioEditor";
import DummyPortfolio from "./pages/DummyPortfolio";
import Export from "./pages/Export";
import Profile from "./pages/Profile";
import MainPortfolio from "./pages/MainPortfolio";
import PublicPortfolioPage from "./pages/PublicPortfolioPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isDummyPortfolio = location.pathname === '/dummy-portfolio';
  const isMainPortfolio = location.pathname === '/main-portfolio';
  const isAuthPage = location.pathname === '/auth';
  const isForgotPasswordPage = location.pathname === '/forgot-password';
  const isResetPasswordPage = location.pathname === '/reset-password';
  const isEntryPage = isAuthPage || isForgotPasswordPage || isResetPasswordPage;
  const isPublicPortfolio = location.pathname.startsWith('/portfolio/');

  return (
    <>
      {!isDummyPortfolio && !isMainPortfolio && !isEntryPage && !isPublicPortfolio && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/projects" element={<PrivateRoute><Projects /></PrivateRoute>} />
        <Route path="/achievements" element={<PrivateRoute><Achievements /></PrivateRoute>} />
        <Route path="/skills" element={<PrivateRoute><Skills /></PrivateRoute>} />
        <Route path="/portfolio" element={<PrivateRoute><PortfolioEditor /></PrivateRoute>} />
        <Route path="/dummy-portfolio" element={<DummyPortfolio />} />

        {/* Dynamic public portfolio route */}
        <Route path="/portfolio/:username" element={<PublicPortfolioPage />} />

        {/* Keep main-portfolio for backwards compatibility */}
        <Route path="/main-portfolio" element={<MainPortfolio />} />

        <Route path="/export" element={<PrivateRoute><Export /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isDummyPortfolio && !isMainPortfolio && !isEntryPage && !isPublicPortfolio && <AIAssistant />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PortfolioProvider>
            <AppContent />
          </PortfolioProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
