import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Batches from "./pages/Batches";
import DailyLogs from "./pages/DailyLogs";
import Marketplace from "./pages/Marketplace";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Orders from "./pages/Orders";
import Posted from "./pages/Posted";
import NotFound from "./pages/NotFound";
import { PreferencesProvider } from "./context/preferences";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PreferencesProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/logs" element={<DailyLogs />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/posted" element={<Posted />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </PreferencesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
