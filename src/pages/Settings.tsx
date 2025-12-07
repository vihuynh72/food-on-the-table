import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationType, NOTIFICATION_TYPE_META } from "@/types/notifications";
import { Bell, Heart, Check, X, MessageSquare, Package, Gift, User, Loader2 } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";
  const [username, setUsername] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const { 
    preferences, 
    preferencesLoading, 
    updatePreferences, 
    isUpdatingPreferences 
  } = useNotifications();

  // Icon mapping for notification types
  const notificationIcons: Record<string, typeof Bell> = {
    interest_received: Heart,
    interest_accepted: Check,
    interest_declined: X,
    message_received: MessageSquare,
    pickup_confirmed: Package,
    donation_complete: Gift,
  };

  useEffect(() => {
    if (!user) return; // ProfileGuard handles redirect

    // Fetch user profile
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, zip_code')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUsername(data.username || "");
        setZipCode(data.zip_code || "");
      }
      setIsFetching(false);
    };

    fetchProfile();
  }, [user, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username.length < 3) {
      toast({
        title: "Invalid username",
        description: "Username must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast({
        title: "Invalid username",
        description: "Username can only contain letters, numbers, and underscores",
        variant: "destructive",
      });
      return;
    }

    if (zipCode && !/^\d{5}$/.test(zipCode)) {
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
      .update({ username, zip_code: zipCode || null })
      .eq('user_id', user!.id);

    setIsLoading(false);

    if (error) {
      // Check for unique constraint violation
      if (error.code === '23505') {
        toast({
          title: "Username taken",
          description: "That username is already in use. Please choose another.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
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
        
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your profile and location settings</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
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
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="foodlover123"
                      maxLength={20}
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    />
                    <p className="text-xs text-muted-foreground">This is how others see you in the community</p>
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
                    {isLoading ? "Updating..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose which notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent>
                {preferencesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Notification type toggles */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Notification Types
                      </h3>
                      {Object.values(NotificationType).map((type) => {
                        const meta = NOTIFICATION_TYPE_META[type];
                        const Icon = notificationIcons[type] || Bell;
                        const preferenceKey = type as keyof typeof preferences;
                        const isEnabled = preferences?.[preferenceKey] === true;

                        return (
                          <div
                            key={type}
                            className="flex items-center justify-between py-3 border-b last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-full flex items-center justify-center ${meta.colorClass}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{meta.label}</p>
                                <p className="text-xs text-muted-foreground">{meta.description}</p>
                              </div>
                            </div>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) => {
                                updatePreferences({ [type]: checked });
                              }}
                              disabled={isUpdatingPreferences}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick actions */}
                    <div className="pt-4 border-t space-y-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const allEnabled: Record<string, boolean> = {};
                          Object.values(NotificationType).forEach(type => {
                            allEnabled[type] = true;
                          });
                          updatePreferences(allEnabled);
                        }}
                        disabled={isUpdatingPreferences}
                      >
                        Enable All Notifications
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full text-muted-foreground"
                        onClick={() => {
                          const allDisabled: Record<string, boolean> = {};
                          Object.values(NotificationType).forEach(type => {
                            allDisabled[type] = false;
                          });
                          updatePreferences(allDisabled);
                        }}
                        disabled={isUpdatingPreferences}
                      >
                        Disable All Notifications
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
