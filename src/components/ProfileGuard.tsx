import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Pages that require authentication
const PROTECTED_ROUTES = ["/settings", "/my-food", "/complete-profile"];
// Pages that should NOT be accessible when logged in
const AUTH_ONLY_ROUTES = ["/auth"];
// Public routes that anyone can access
const PUBLIC_ROUTES = ["/", "/community", "/impact", "/learn", "/donate"];

export function ProfileGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, isProfileLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Combined loading state - wait for both auth and profile
  // If we have a profile that matches the current user, we consider it loaded enough to render
  // This prevents unmounting/remounting during background profile refreshes
  const isFullyLoaded = !isLoading && (!isProfileLoading || (!!profile && profile.user_id === user?.id));

  useEffect(() => {
    // Don't make any routing decisions until everything is loaded
    if (!isFullyLoaded) return;

    const currentPath = location.pathname;
    const isProtectedRoute = PROTECTED_ROUTES.some(route => currentPath.startsWith(route));
    const isAuthRoute = AUTH_ONLY_ROUTES.includes(currentPath);

    // Case 1: User is NOT logged in
    if (!user) {
      // Redirect to auth if trying to access a protected route
      if (isProtectedRoute) {
        navigate("/auth", { replace: true });
      }
      // Otherwise, let them access public routes and auth page
      return;
    }

    // Case 2: User IS logged in
    // Redirect away from auth page
    if (isAuthRoute) {
      navigate("/", { replace: true });
      return;
    }

    // Check if profile is incomplete
    const profileIncomplete = !profile?.username || !profile?.zip_code;

    // If profile incomplete, force to complete-profile (unless already there)
    if (profileIncomplete && currentPath !== "/complete-profile") {
      navigate("/complete-profile", { replace: true });
      return;
    }

    // If profile IS complete, redirect away from complete-profile
    if (!profileIncomplete && currentPath === "/complete-profile") {
      navigate("/", { replace: true });
      return;
    }

  }, [user, profile, isFullyLoaded, navigate, location.pathname]);

  // Show a minimal loading state while determining auth status
  // This prevents the flash/redirect loop
  if (!isFullyLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
