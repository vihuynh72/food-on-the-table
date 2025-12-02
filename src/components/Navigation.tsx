import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Home, Package, Users, Trophy, BookOpen, Settings, LogOut, LogIn, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { NavBar, NavBarSpacer } from "@/components/ui/tubelight-navbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { name: "Home", url: "/", icon: Home },
  { name: "My Food", url: "/my-food", icon: Package },
  { name: "Community", url: "/community", icon: Users },
  { name: "Impact", url: "/impact", icon: Trophy },
  { name: "Learn", url: "/learn", icon: BookOpen },
];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setOpen(false);
  };

  const handleSignIn = () => {
    navigate("/auth");
    setOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation - Tubelight Navbar */}
      <div className="hidden sm:block">
        <NavBar items={navItems} />
        {/* Spacer to prevent content from being hidden */}
        <NavBarSpacer />
        
        {/* Auth button floating on the right */}
        <div className="fixed top-6 right-6 z-50">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10 border-2 border-woodland/20">
                    <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || "User"} />
                    <AvatarFallback className="bg-pine-glade text-woodland font-bold">
                      {user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">My Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/impact")}>
                  <Trophy className="mr-2 h-4 w-4" />
                  <span>My Impact</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={handleSignIn}
              className="flex items-center gap-2 bg-background/90 backdrop-blur-lg border-border shadow-lg rounded-full px-5 py-3 text-base hover:bg-woodland hover:text-white transition-all"
            >
              <LogIn className="h-5 w-5" />
              <span className="hidden lg:inline">Sign In</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation - Bottom Tubelight + Top Bar */}
      <div className="sm:hidden">
        {/* Top bar with logo and menu */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b border-border">
          <div className="flex h-14 items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Food on the Table</span>
            </Link>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col gap-4 mt-8">
                  {user && (
                    <div className="flex items-center gap-3 px-2 mb-4">
                      <Avatar className="h-10 w-10 border border-woodland/20">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-pine-glade text-woodland">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.email}</span>
                        <span className="text-xs text-muted-foreground">Member</span>
                      </div>
                    </div>
                  )}
                  
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.url;
                    return (
                      <Link
                        key={item.url}
                        to={item.url}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}

                  <div className="my-2 border-t border-border/50" />

                  {user ? (
                    <>
                      <Link
                        to="/settings"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Settings className="h-5 w-5" />
                        <span>Settings</span>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 px-4 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleSignIn}
                      className="flex w-full items-center gap-2 px-4 py-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                    >
                      <LogIn className="h-5 w-5" />
                      <span>Sign In</span>
                    </button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
        
        {/* Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
          <NavBar items={navItems} />
        </div>
      </div>
    </>
  );
}
