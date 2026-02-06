import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isOnboardingComplete, getSelectedLocation } from "@/lib/device";
import { SwipeBackProvider } from "@/components/SwipeBackProvider";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { AIAssistantButton } from "@/components/AIAssistant";

import Onboarding from "./pages/Onboarding";
import SelectLocation from "./pages/SelectLocation";
import Home from "./pages/Home";
import NewReport from "./pages/NewReport";
import ReportSuccess from "./pages/ReportSuccess";
import ReportDetail from "./pages/ReportDetail";
import ReportsFeed from "./pages/ReportsFeed";
import ForwardReport from "./pages/ForwardReport";
import AgenciesList from "./pages/AgenciesList";
import InstallPage from "./pages/InstallPage";
import Dashboard from "./pages/Dashboard";
import ReportsMap from "./pages/ReportsMap";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReports from "./pages/admin/AdminReports";
import AdminAgencies from "./pages/admin/AdminAgencies";
import AdminModeration from "./pages/admin/AdminModeration";
import AdminReportDetail from "./pages/admin/AdminReportDetail";

// Atlas pages
import { AtlasDashboard, AtlasFederal } from "./pages/Atlas";

const queryClient = new QueryClient();

function InitialRedirect() {
  const onboardingComplete = isOnboardingComplete();
  const location = getSelectedLocation();
  
  if (!onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }
  
  if (!location) {
    return <Navigate to="/selecionar-local" replace />;
  }
  
  return <Navigate to="/home" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <OfflineProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SwipeBackProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<InitialRedirect />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/selecionar-local" element={<SelectLocation />} />
              <Route path="/home" element={<Home />} />
              <Route path="/nova-denuncia" element={<NewReport />} />
              <Route path="/sucesso/:protocol" element={<ReportSuccess />} />
              <Route path="/denuncia/:id" element={<ReportDetail />} />
              <Route path="/denuncias" element={<ReportsFeed />} />
              <Route path="/encaminhar/:id" element={<ForwardReport />} />
              <Route path="/orgaos" element={<AgenciesList />} />
              <Route path="/estatisticas" element={<Dashboard />} />
              <Route path="/mapa" element={<ReportsMap />} />
              <Route path="/instalar" element={<InstallPage />} />
              
              {/* Atlas routes */}
              <Route path="/atlas" element={<AtlasDashboard />} />
              <Route path="/atlas/federal" element={<AtlasFederal />} />
              
              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="denuncias" element={<AdminReports />} />
                <Route path="denuncia/:id" element={<AdminReportDetail />} />
                <Route path="orgaos" element={<AdminAgencies />} />
                <Route path="moderacao" element={<AdminModeration />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            {/* AI Assistant - available on all pages */}
            <AIAssistantButton />
          </SwipeBackProvider>
        </BrowserRouter>
      </OfflineProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
