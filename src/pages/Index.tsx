import { useState, useEffect, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { FoodItemCard } from "@/components/FoodItemCard";
import { StatCard } from "@/components/StatCard";
import { QuickActionGrid } from "@/components/QuickActionGrid";
import { AddFoodModal } from "@/components/food/AddFoodModal";
import { RecipeSuggestionsModal } from "@/components/food/RecipeSuggestionsModal";
import { TriageQuiz } from "@/components/TriageQuiz";
import { HeroMeshGradient } from "@/components/ui/hero-mesh-gradient";
import { Button } from "@/components/ui/button";
import { CircularGallery, type GalleryItem } from "@/components/ui/circular-gallery";
import { Apple, Carrot, Milk, Egg, Users, MapPin, Trophy, Plus, Sparkles, Wheat, Beef, Fish, Cookie, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useAuth } from "@/contexts/AuthContext";
import { useFoodInventory } from "@/hooks/useFoodInventory";
import { HomeImpactSection } from "@/components/home/HomeImpactSection";

const mockGalleryItems: GalleryItem[] = [
  {
    common: "Milk",
    binomial: "2 days left",
    icon: <span className="text-[120px]">🥛</span>,
    color: "bg-[#44562f]" // Woodland
  },
  {
    common: "Spinach",
    binomial: "1 day left",
    icon: <span className="text-[120px]">🥬</span>,
    color: "bg-[#83934d]" // Asparagus
  },
  {
    common: "Avocado",
    binomial: "Use today",
    icon: <span className="text-[120px]">🥑</span>,
    color: "bg-[#b7c88d]" // Pine Glade
  },
  {
    common: "Bread",
    binomial: "3 days left",
    icon: <span className="text-[120px]">🍞</span>,
    color: "bg-[#e9dfb4]" // Raffia
  },
  {
    common: "Eggs",
    binomial: "5 days left",
    icon: <span className="text-[120px]">🥚</span>,
    color: "bg-[#efbfb3]" // Desert Sand
  }
];

interface FloatingIconProps {
  icon: LucideIcon;
  className?: string;
  delay: number;
}

const FloatingIcon = ({ icon: Icon, className, delay }: FloatingIconProps) => (
  <motion.div
    animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
    transition={{ duration: 5, delay, repeat: Infinity, ease: "easeInOut" }}
    className={`absolute pointer-events-none opacity-20 ${className}`}
  >
    <Icon className="w-16 h-16 text-woodland" />
  </motion.div>
);

export default function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getExpiringSoonItems, loading, addItem } = useFoodInventory();
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);

  const handleTriageClick = () => {
    setShowTriageModal(true);
  };

  const handleQuizComplete = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#8fa664", "#c4d9a8", "#f5e6c8", "#e8d4c4", "#9ab86e"] // Forest Moth palette
    });
  };

  const galleryItems: GalleryItem[] = useMemo(() => {
    if (!user) {
      return mockGalleryItems;
    }

    const expiringItems = getExpiringSoonItems();
    if (expiringItems.length === 0) {
      // If logged in but no expiring items, show a friendly message or fallback to mock items with a different message?
      // The requirement says: "Logged-in user with no items → hero shows a friendly message like “You have nothing expiring soon. Add items to track them!” and a button to go to MyFood."
      // But CircularGallery needs items.
      // I'll handle the "no items" case in the render logic.
      return [];
    }

    // Map real items to GalleryItem
    return expiringItems.slice(0, 6).map((item) => {
      const nameLower = item.name.toLowerCase();
      let icon = <span className="text-[120px]">📦</span>;
      let color = "bg-[#44562f]"; // Woodland

      // Try to find icon in knowledge base first
      // We need to import foodKnowledgeBase, but for now let's use the existing logic + improvements
      if (nameLower.includes("milk") || item.category?.toLowerCase().includes("dairy")) {
        icon = <span className="text-[120px]">🥛</span>;
        color = "bg-[#44562f]"; // Woodland
      } else if (nameLower.includes("fruit") || nameLower.includes("apple") || nameLower.includes("banana")) {
        icon = <span className="text-[120px]">🍎</span>;
        color = "bg-[#efbfb3]"; // Desert Sand
      } else if (nameLower.includes("vegetable") || nameLower.includes("carrot") || nameLower.includes("spinach")) {
        icon = <span className="text-[120px]">🥕</span>;
        color = "bg-[#83934d]"; // Asparagus
      } else if (nameLower.includes("bread") || nameLower.includes("bakery")) {
        icon = <span className="text-[120px]">🍞</span>;
        color = "bg-[#e9dfb4]"; // Raffia
      } else if (nameLower.includes("meat") || nameLower.includes("chicken") || nameLower.includes("beef")) {
        icon = <span className="text-[120px]">🥩</span>;
        color = "bg-[#b7c88d]"; // Pine Glade
      } else if (nameLower.includes("egg")) {
        icon = <span className="text-[120px]">🥚</span>;
        color = "bg-[#e9dfb4]"; // Raffia
      } else if (nameLower.includes("fish") || nameLower.includes("seafood")) {
        icon = <span className="text-[120px]">🐟</span>;
        color = "bg-[#44562f]"; // Woodland
      }

      const daysLeft = Math.ceil((new Date(item.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const binomial = daysLeft < 0 ? "Expired" : daysLeft === 0 ? "Use today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;

      return {
        common: item.name,
        binomial: binomial,
        icon: icon,
        color: color,
        id: item.id // Pass ID for click handling
      };
    });
  }, [user, getExpiringSoonItems]);

  const handleGalleryItemClick = (item: GalleryItem) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    // Navigate to My Food page to manage the item
    navigate("/my-food");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Hero Section with Animated Mesh Gradient */}
        <HeroMeshGradient
          distortion={0.7}
          swirl={0.5}
          speed={0.25}
          minHeight="min-h-[420px] md:min-h-[480px]"
          className="relative overflow-hidden"
        >
          {/* Floating Icons */}
          <FloatingIcon icon={Apple} className="top-10 left-10" delay={0} />
          <FloatingIcon icon={Carrot} className="bottom-20 right-10" delay={1} />
          <FloatingIcon icon={Milk} className="top-20 right-20" delay={2} />
          <FloatingIcon icon={Egg} className="bottom-10 left-20" delay={3} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/40 backdrop-blur-sm border border-border/50 mb-6"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground/80">Smart Food Decisions</span>
            </motion.div>
            
            <h1 className="font-bold text-foreground text-balance text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              Got Food?{""}
              <span className="text-primary"><br></br>Decide Before It Spoils</span>
            </h1>
            
            <p className="text-lg md:text-xl text-foreground/80 text-pretty max-w-2xl mx-auto leading-relaxed mb-8">
              Take our quick quiz to find the best way to use your food—donate, share, cook, or compost.
              Every decision saves food and reduces waste.
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Button
                onClick={handleTriageClick}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                I have food — What should I do?
              </Button>
            </motion.div>
          </motion.div>
        </HeroMeshGradient>

        {/* Triage Quiz Modal */}
        <TriageQuiz 
          open={showTriageModal} 
          onOpenChange={setShowTriageModal} 
          onComplete={handleQuizComplete}
        />

        {/* Use This Next Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-foreground text-2xl font-bold">Use This Next</h2>
              <p className="text-muted-foreground mt-2">
                {user ? "Items from your inventory that need attention" : "Track your food and reduce waste"}
              </p>
            </div>
            {user && (
              <Button
                variant="outline"
                onClick={() => navigate("/my-food")}
                className="hover:bg-muted"
              >
                View All Food
              </Button>
            )}
          </div>

          <div className="h-[500px] w-full relative overflow-hidden rounded-xl bg-gradient-to-b from-background to-muted/20 border border-border/50">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : user && galleryItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Sparkles className="h-12 w-12 text-primary mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">You have nothing expiring soon!</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Great job managing your inventory. Add new items to start tracking them.
                </p>
                <Button onClick={() => navigate("/my-food")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Food Items
                </Button>
              </div>
            ) : (
              <>
                <CircularGallery 
                  items={galleryItems} 
                  onItemClick={handleGalleryItemClick} 
                  radius={300} 
                  autoRotateSpeed={0.04}
                />
                {!user && (
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
                    <div className="bg-background/90 backdrop-blur-xl p-6 rounded-2xl border border-border/50 shadow-2xl text-center max-w-md mx-4 transform hover:scale-105 transition-all duration-300">
                      <h3 className="text-lg font-bold mb-2 text-foreground">Unlock Your Personal Inventory</h3>
                      <p className="mb-4 text-muted-foreground text-sm">Join to track your own food & reduce waste</p>
                      <Button onClick={() => navigate("/auth")} className="w-full font-semibold shadow-lg" size="lg">
                        Get Started
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="space-y-6">
          <h2 className="text-foreground text-2xl font-bold">Quick Actions</h2>
          <QuickActionGrid 
            onAddFood={() => setAddFoodOpen(true)} 
            onGenerateRecipe={() => navigate("/recipe-generator")}
          />
        </section>

        {/* Impact Snapshot */}
        <HomeImpactSection />
      </main>

      {/* Add Food Modal */}
      <AddFoodModal
        open={addFoodOpen}
        onOpenChange={setAddFoodOpen}
        onSubmit={addItem}
      />

      {/* Recipe Suggestions Modal */}
      <RecipeSuggestionsModal
        open={recipeModalOpen}
        onOpenChange={setRecipeModalOpen}
      />
    </div>
  );
}
