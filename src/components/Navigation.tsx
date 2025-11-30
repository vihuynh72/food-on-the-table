import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, Home, Package, Users, Trophy, BookOpen, Settings, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { NavBar, NavBarSpacer } from "@/components/ui/tubelight-navbar";

const navItems = [
  { name: "Home", url: "/", icon: Home },
  { name: "My Food", url: "/my-food", icon: Package },
  { name: "Community", url: "/community", icon: Users },
  { name: "Impact", url: "/impact", icon: Trophy },
  { name: "Learn", url: "/learn", icon: BookOpen },
  { name: "Settings", url: "/settings", icon: Settings },
];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleAuthAction = async () => {
    if (user) {
      await signOut();
      navigate("/");
    } else {
      navigate("/auth");
    }
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
          <Button
            variant="outline"
            size="lg"
            onClick={handleAuthAction}
            className="flex items-center gap-2 bg-background/90 backdrop-blur-lg border-border shadow-lg rounded-full px-5 py-3 text-base"
          >
            {user ? (
              <>
                <LogOut className="h-5 w-5" />
                <span className="hidden lg:inline">Sign Out</span>
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span className="hidden lg:inline">Sign In</span>
              </>
            )}
          </Button>
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
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-lg font-bold">Food on the Table</span>
                  </div>
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
                          "hover:bg-muted/50",
                          isActive && "bg-primary text-primary-foreground font-medium"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                  <Button
                    variant="ghost"
                    onClick={handleAuthAction}
                    className="flex items-center gap-2 justify-start"
                  >
                    {user ? (
                      <>
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5" />
                        Sign In
                      </>
                    )}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>

        {/* Spacer for mobile top bar */}
        <div className="h-16" aria-hidden="true" />

        {/* Bottom Tubelight Navbar for mobile */}
        <NavBar items={navItems} className="sm:hidden top-auto bottom-0 mb-4 sm:mb-0 sm:pt-0" />
        
        {/* Bottom spacer for mobile to account for bottom navbar */}
        <div className="h-24" aria-hidden="true" />
      </div>
    </>
  );
}
