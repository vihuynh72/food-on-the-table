import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import MyFood from "./pages/MyFood";
import Community from "./pages/Community";
import Impact from "./pages/ImpactNew";
import Learn from "./pages/Learn";
import SavedReels from "./pages/SavedReels";
import Settings from "./pages/Settings";
import Donate from "./pages/Donate";
import Auth from "./pages/Auth";
import CompleteProfile from "./pages/CompleteProfile";
import RecipeGenerator from "./pages/RecipeGenerator";
import NotFound from "./pages/NotFound";
import { ProfileGuard } from "@/components/ProfileGuard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ProfileGuard>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/my-food" element={<MyFood />} />
              <Route path="/community" element={<Community />} />
              <Route path="/impact" element={<Impact />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/my-collection" element={<SavedReels />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/complete-profile" element={<CompleteProfile />} />
              <Route path="/recipe-generator" element={<RecipeGenerator />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ProfileGuard>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
