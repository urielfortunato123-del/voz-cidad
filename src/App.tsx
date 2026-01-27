import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isOnboardingComplete, getSelectedLocation } from "@/lib/device";

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
import NotFound from "./pages/NotFound";

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
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
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
          <Route path="/instalar" element={<InstallPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
