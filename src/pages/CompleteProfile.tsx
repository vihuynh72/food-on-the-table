import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Leaf, LogOut } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";
import { HeroMeshGradient } from "@/components/ui/hero-mesh-gradient";
import { useAuth } from "@/contexts/AuthContext";

const profileSchema = z.object({
  username: z.string().trim().min(3, { message: "Username must be at least 3 characters" }).max(20, { message: "Username must be at most 20 characters" }).regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
  zipCode: z.string().trim().regex(/^\d{5}$/, { message: "Zip code must be 5 digits" }),
});

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session, signOut, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [username, setUsername] = useState("");
  const [zipCode, setZipCode] = useState("");

  // ProfileGuard handles auth redirects - no need for duplicate logic here

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = profileSchema.parse({ 
        username,
        zipCode 
      });
      
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          user_id: user.id,
          username: validated.username,
          zip_code: validated.zipCode,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        if (error.message.includes("unique constraint")) {
             toast({
            title: "Username taken",
            description: "This username is already taken. Please choose another one.",
            variant: "destructive",
          });
        } else {
            toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
            });
        }
      } else {
        await refreshProfile();
        toast({
          title: "Profile updated!",
          description: "Welcome to the community.",
        });
        navigate("/");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background">
       {/* Background Elements */}
       <div className="absolute inset-0 z-0">
          <HeroMeshGradient
            distortion={0.5}
            swirl={0.3}
            speed={0.2}
            className="h-full w-full opacity-40"
          />
       </div>
       
       {/* Main Card */}
       <motion.div
         initial={{ opacity: 0, scale: 0.95, y: 20 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         transition={{ duration: 0.4 }}
         className="z-10 w-full max-w-md px-4"
       >
         <Card className="border-woodland/10 shadow-2xl bg-white/80 backdrop-blur-md">
           <CardHeader className="text-center space-y-2 relative">
             <div className="absolute right-0 top-0">
                <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                </Button>
             </div>
             <div className="mx-auto bg-pine-glade/30 w-12 h-12 rounded-full flex items-center justify-center mb-2">
               <Leaf className="h-6 w-6 text-woodland" />
             </div>
             <CardTitle className="text-2xl font-bold text-woodland">Complete Your Profile</CardTitle>
             <CardDescription>
               Just a few more details to get you started.
             </CardDescription>
           </CardHeader>
           <CardContent>
             <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-2">
                 <Label htmlFor="username">Username</Label>
                 <Input
                   id="username"
                   type="text"
                   placeholder="foodlover123"
                   maxLength={20}
                   value={username}
                   onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                   required
                 />
                 <p className="text-xs text-muted-foreground">Letters, numbers, and underscores only</p>
               </div>
               <div className="space-y-2">
                 <Label htmlFor="zip-code">Zip Code</Label>
                 <Input
                   id="zip-code"
                   type="text"
                   placeholder="12345"
                   maxLength={5}
                   value={zipCode}
                   onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                   required
                 />
               </div>
               <Button type="submit" className="w-full bg-woodland hover:bg-woodland/90" disabled={isLoading}>
                 {isLoading ? "Saving..." : "Complete Profile"}
               </Button>
             </form>
           </CardContent>
         </Card>
       </motion.div>
    </div>
  );
}
