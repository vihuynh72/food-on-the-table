import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProfileGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    // Only redirect if user is logged in
    if (user) {
      // If user is logged in but has no username, redirect to complete profile
      // But allow them to stay on the complete profile page and auth page
      if ((!profile?.username || !profile?.zip_code) && 
          location.pathname !== "/complete-profile" && 
          location.pathname !== "/auth") {
        navigate("/complete-profile");
      }
      
      // If user is logged in and has a username, redirect away from complete profile
      if (profile?.username && profile?.zip_code && location.pathname === "/complete-profile") {
        navigate("/");
      }
    }

  }, [user, profile, isLoading, navigate, location.pathname]);

  // Don't block rendering while loading
  return <>{children}</>;
}
