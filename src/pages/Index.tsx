import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { FoodItemCard } from "@/components/FoodItemCard";
import { StatCard } from "@/components/StatCard";
import { QuickActionCard } from "@/components/QuickActionCard";
import { TriageQuiz } from "@/components/TriageQuiz";
import { HeroMeshGradient } from "@/components/ui/hero-mesh-gradient";
import { Button } from "@/components/ui/button";
import { Apple, Carrot, Milk, Egg, Users, MapPin, Trophy, Plus, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const mockFoodItems = [
  {
    id: 1,
    name: "Fresh Strawberries",
    quantity: "250g",
    status: "urgent" as const,
    statusText: "Use Today",
    primaryAction: "Eat or Share",
    icon: <Apple className="h-5 w-5 text-primary" />,
  },
  {
    id: 2,
    name: "Organic Carrots",
    quantity: "1kg",
    status: "medium" as const,
    statusText: "Use in 2 days",
    primaryAction: "Cook",
    icon: <Carrot className="h-5 w-5 text-primary" />,
  },
  {
    id: 3,
    name: "Milk (Unopened)",
    quantity: "1L",
    status: "medium" as const,
    statusText: "Use in 3 days",
    primaryAction: "Donate",
    icon: <Milk className="h-5 w-5 text-primary" />,
  },
  {
    id: 4,
    name: "Eggs",
    quantity: "6 pack",
    status: "low" as const,
    statusText: "Freezable",
    primaryAction: "Freeze",
    icon: <Egg className="h-5 w-5 text-primary" />,
  },
];

export default function Index() {
  const navigate = useNavigate();
  const [showTriageModal, setShowTriageModal] = useState(false);

  const handleTriageClick = () => {
    setShowTriageModal(true);
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
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center"
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
              Got Food?{" "}
              <span className="text-primary">Decide Before It Spoils</span>
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
        <TriageQuiz open={showTriageModal} onOpenChange={setShowTriageModal} />

        {/* Use This Next Section */}
        <section className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-foreground">Use This Next</h2>
              <p className="text-muted-foreground mt-2">
                Items that need your attention soon
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/my-food")}
              className="hover:bg-muted"
            >
              View All Food
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockFoodItems.map((item) => (
              <FoodItemCard
                key={item.id}
                name={item.name}
                quantity={item.quantity}
                status={item.status}
                statusText={item.statusText}
                primaryAction={{
                  label: item.primaryAction,
                  onClick: () => console.log(`Action: ${item.primaryAction} for ${item.name}`),
                }}
                secondaryActions={[
                  { label: "Open Triage", onClick: () => setShowTriageModal(true) },
                  { label: "Edit Details", onClick: () => console.log("Edit") },
                  { label: "Mark as Used", onClick: () => console.log("Used") },
                ]}
                icon={item.icon}
              />
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="space-y-6 animate-fade-in">
          <h2 className="text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionCard
              title="Add Food"
              icon={Plus}
              onClick={() => navigate("/my-food")}
            />
            <QuickActionCard
              title="Community"
              icon={Users}
              onClick={() => navigate("/community")}
            />
            <QuickActionCard
              title="View Impact"
              icon={Trophy}
              onClick={() => navigate("/impact")}
            />
            <QuickActionCard
              title="Find Donation Spots"
              icon={MapPin}
              onClick={() => navigate("/donate")}
            />
          </div>
        </section>

        {/* Impact Snapshot */}
        <section className="space-y-6 animate-fade-in">
          <h2 className="text-foreground">Your Impact This Month</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Food Saved"
              value="5 kg"
              subtitle="↑ 12% from last month"
              icon={Apple}
              iconColor="text-secondary"
            />
            <StatCard
              title="CO₂ Reduced"
              value="12 kg"
              subtitle="↑ 15% from last month"
              icon={Trophy}
              iconColor="text-primary"
            />
            <StatCard
              title="Money Saved"
              value="$23"
              subtitle="↑ 8% from last month"
              icon={Users}
              iconColor="text-accent"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
