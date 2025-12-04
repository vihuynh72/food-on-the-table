import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Chrome, ArrowLeft, Leaf, Apple, Carrot } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";
import { HeroMeshGradient } from "@/components/ui/hero-mesh-gradient";

const signupSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  username: z.string().trim().min(3, { message: "Username must be at least 3 characters" }).max(20, { message: "Username must be at most 20 characters" }).regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
  zipCode: z.string().trim().regex(/^\d{5}$/, { message: "Zip code must be 5 digits" }),
});

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [zipCode, setZipCode] = useState("");

  // Redirect if already logged in (using shared auth context)
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = loginSchema.parse({ email: loginEmail, password: loginPassword });
      
      const { error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Login failed",
            description: "Invalid email or password. Please try again.",
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
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = signupSchema.parse({ 
        email: signupEmail, 
        password: signupPassword,
        username: signupUsername,
        zipCode 
      });
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { error: signUpError, data } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            zip_code: validated.zipCode,
            username: validated.username,
          }
        }
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please log in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Signup failed",
            description: signUpError.message,
            variant: "destructive",
          });
        }
      } else if (data.user) {
        // Update profile with zip code and username
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ zip_code: validated.zipCode, username: validated.username })
          .eq('user_id', data.user.id);

        if (profileError) {
          console.error("Error updating profile:", profileError);
        }

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
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

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
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
       
       {/* Floating Icons (Decorative) */}
       <motion.div 
         animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
         transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
         className="absolute top-20 left-20 text-woodland/20 hidden md:block"
       >
         <Apple size={64} />
       </motion.div>
       <motion.div 
         animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
         transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
         className="absolute bottom-20 right-20 text-asparagus/20 hidden md:block"
       >
         <Carrot size={64} />
       </motion.div>

       {/* Back Button */}
       <motion.div 
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         className="absolute top-6 left-6 z-20"
       >
         <Button variant="ghost" onClick={() => navigate("/")} className="gap-2 hover:bg-white/50">
           <ArrowLeft className="h-4 w-4" />
           Back to Home
         </Button>
       </motion.div>

       {/* Main Card */}
       <motion.div
         initial={{ opacity: 0, scale: 0.95, y: 20 }}
         animate={{ opacity: 1, scale: 1, y: 0 }}
         transition={{ duration: 0.4 }}
         className="z-10 w-full max-w-md px-4"
       >
         <Card className="border-woodland/10 shadow-2xl bg-white/80 backdrop-blur-md">
           <CardHeader className="text-center space-y-2">
             <div className="mx-auto bg-pine-glade/30 w-12 h-12 rounded-full flex items-center justify-center mb-2">
               <Leaf className="h-6 w-6 text-woodland" />
             </div>
             <CardTitle className="text-2xl font-bold text-woodland">Welcome to Food on the Table</CardTitle>
             <CardDescription>
               Join our community to reduce waste and share food.
             </CardDescription>
           </CardHeader>
           <CardContent>
             <Tabs defaultValue="login" className="w-full">
               <TabsList className="grid w-full grid-cols-2 mb-6">
                 <TabsTrigger value="login">Login</TabsTrigger>
                 <TabsTrigger value="signup">Sign Up</TabsTrigger>
               </TabsList>
               
               <TabsContent value="login">
                 <div className="space-y-4">
                   <Button
                     type="button"
                     variant="outline"
                     className="w-full"
                     onClick={handleGoogleSignIn}
                   >
                     <Chrome className="mr-2 h-4 w-4" />
                     Continue with Google
                   </Button>
                   
                   <div className="relative">
                     <div className="absolute inset-0 flex items-center">
                       <Separator />
                     </div>
                     <div className="relative flex justify-center text-xs uppercase">
                       <span className="bg-background px-2 text-muted-foreground">
                         Or continue with email
                       </span>
                     </div>
                   </div>

                   <form onSubmit={handleLogin} className="space-y-4">
                     <div className="space-y-2">
                       <Label htmlFor="login-email">Email</Label>
                       <Input
                         id="login-email"
                         type="email"
                         placeholder="your@email.com"
                         value={loginEmail}
                         onChange={(e) => setLoginEmail(e.target.value)}
                         required
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="login-password">Password</Label>
                       <Input
                         id="login-password"
                         type="password"
                         placeholder="••••••••"
                         value={loginPassword}
                         onChange={(e) => setLoginPassword(e.target.value)}
                         required
                       />
                     </div>
                     <Button type="submit" className="w-full bg-woodland hover:bg-woodland/90" disabled={isLoading}>
                       {isLoading ? "Logging in..." : "Login"}
                     </Button>
                   </form>

                   <p className="text-xs text-center text-muted-foreground">
                     By continuing, you agree to our Terms and Privacy Policy
                   </p>
                 </div>
               </TabsContent>
               
               <TabsContent value="signup">
                 <div className="space-y-4">
                   <Button
                     type="button"
                     variant="outline"
                     className="w-full"
                     onClick={handleGoogleSignIn}
                   >
                     <Chrome className="mr-2 h-4 w-4" />
                     Continue with Google
                   </Button>
                   
                   <div className="relative">
                     <div className="absolute inset-0 flex items-center">
                       <Separator />
                     </div>
                     <div className="relative flex justify-center text-xs uppercase">
                       <span className="bg-background px-2 text-muted-foreground">
                         Or continue with email
                       </span>
                     </div>
                   </div>

                   <form onSubmit={handleSignup} className="space-y-4">
                     <div className="space-y-2">
                       <Label htmlFor="signup-email">Email</Label>
                       <Input
                         id="signup-email"
                         type="email"
                         placeholder="your@email.com"
                         value={signupEmail}
                         onChange={(e) => setSignupEmail(e.target.value)}
                         required
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="signup-password">Password</Label>
                       <Input
                         id="signup-password"
                         type="password"
                         placeholder="••••••••"
                         value={signupPassword}
                         onChange={(e) => setSignupPassword(e.target.value)}
                         required
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="signup-username">Username</Label>
                       <Input
                         id="signup-username"
                         type="text"
                         placeholder="foodlover123"
                         maxLength={20}
                         value={signupUsername}
                         onChange={(e) => setSignupUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
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
                       {isLoading ? "Creating account..." : "Sign Up"}
                     </Button>
                   </form>

                   <p className="text-xs text-center text-muted-foreground">
                     By continuing, you agree to our Terms and Privacy Policy
                   </p>
                 </div>
               </TabsContent>
             </Tabs>
           </CardContent>
         </Card>
       </motion.div>
    </div>
  );
}
