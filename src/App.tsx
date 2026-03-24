import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TaskProvider } from "@/context/TaskContext";
import Landing from "./pages/Landing";
import Goal from "./pages/Goal";
import BrainDump from "./pages/BrainDump";
import Filtering from "./pages/Filtering";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const App = () => (
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
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </TaskProvider>
);

export default App;
