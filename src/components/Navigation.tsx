import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Package, Users, Trophy, BookOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "My Food", href: "/my-food", icon: Package },
  { name: "Community", href: "/community", icon: Users },
  { name: "Impact & Rewards", href: "/impact", icon: Trophy },
  { name: "Learn", href: "/learn", icon: BookOpen },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const NavLink = ({ item, mobile = false }: { item: typeof navItems[0]; mobile?: boolean }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        to={item.href}
        onClick={() => mobile && setOpen(false)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
          "hover:bg-muted/50 hover-lift",
          isActive && "bg-primary text-primary-foreground font-medium"
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Food on the Table</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </div>

          {/* Mobile Navigation */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
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
                {navItems.map((item) => (
                  <NavLink key={item.href} item={item} mobile />
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
