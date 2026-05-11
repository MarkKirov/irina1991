import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TaskProvider } from "@/context/TaskContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAutoUpdate } from "@/hooks/useAutoUpdate";
import Landing from "./pages/Landing";
import Goal from "./pages/Goal";
import BrainDump from "./pages/BrainDump";
import Filtering from "./pages/Filtering";
import Dashboard from "./pages/Dashboard";
import WeeklyReport from "./pages/WeeklyReport";
import Mentorship from "./pages/Mentorship";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const App = () => {
  useAutoUpdate();
  return (
  <AuthProvider>
    <TaskProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/goal" element={<Goal />} />
            <Route path="/dump" element={<BrainDump />} />
            <Route path="/filter" element={<Filtering />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/report" element={<ProtectedRoute><WeeklyReport /></ProtectedRoute>} />
            <Route path="/mentorship" element={<ProtectedRoute><Mentorship /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </TaskProvider>
  </AuthProvider>
  );
};

export default App;
