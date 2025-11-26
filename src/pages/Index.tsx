import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { FoodItemCard } from "@/components/FoodItemCard";
import { StatCard } from "@/components/StatCard";
import { QuickActionCard } from "@/components/QuickActionCard";
import { TriageQuiz } from "@/components/TriageQuiz";
import { Button } from "@/components/ui/button";
import { Apple, Carrot, Milk, Egg, Users, MapPin, Trophy, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl p-8 md:p-12 lg:p-16 bg-gradient-to-br from-raffia to-pine-glade animate-fade-in">
          <div className="relative z-10 max-w-3xl">
            <h1 className="mb-4 text-foreground">Got Food? Decide Before It Spoils</h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
              Take our quick quiz to find the best way to use your food—donate, share, cook, or compost.
              Every decision saves food and reduces waste.
            </p>
            <Button
              onClick={handleTriageClick}
              size="lg"
              className="bg-primary hover:bg-asparagus text-primary-foreground transition-all duration-300 hover-lift text-lg px-8 py-6"
            >
              I have food — What should I do?
            </Button>
          </div>
        </section>

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
