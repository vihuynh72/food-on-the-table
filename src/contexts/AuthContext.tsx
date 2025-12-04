import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  zip_code: string | null;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isProfileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const fetchProfile = async (userId: string, showLoading = true) => {
    if (showLoading) setIsProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data as Profile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } finally {
      if (showLoading) setIsProfileLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change:", event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        if (session?.user) {
          // Don't await - let it run in background, but profile loading state handles UI
          // Don't show loading spinner for token refreshes to avoid UI flicker/reset
          const shouldShowLoading = event !== 'TOKEN_REFRESHED';
          fetchProfile(session.user.id, shouldShowLoading);
        } else {
          setProfile(null);
          setIsProfileLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setIsProfileLoading(false);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.clear(); // Force clear everything to be safe
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, isProfileLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
