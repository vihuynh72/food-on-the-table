import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [zipCode, setZipCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Fetch user profile
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('zip_code')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setZipCode(data.zip_code || "");
      }
      setIsFetching(false);
    };

    fetchProfile();
  }, [user, navigate]);

  const handleUpdateZipCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!/^\d{5}$/.test(zipCode)) {
      toast({
        title: "Invalid zip code",
        description: "Zip code must be 5 digits",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ zip_code: zipCode })
      .eq('user_id', user!.id);

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update zip code",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Zip code updated successfully",
      });
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-6">Settings</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your location to find nearby donation centers</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateZipCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  type="text"
                  placeholder="12345"
                  maxLength={5}
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Zip Code"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
