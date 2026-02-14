import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthPage from "./pages/AuthPage";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import InvoicesPage from "./pages/InvoicesPage";
import IssuesPage from "./pages/IssuesPage";
import LedgerPage from "./pages/LedgerPage";
import CalendarPage from "./pages/CalendarPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/issues" element={<IssuesPage />} />
              <Route path="/ledger" element={<LedgerPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
