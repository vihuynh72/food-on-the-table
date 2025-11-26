import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreVertical, Apple, Carrot, Milk, Egg, Refrigerator, Snowflake, Package as PackageIcon } from "lucide-react";

const mockInventory = [
  {
    id: 1,
    name: "Fresh Strawberries",
    quantity: "250g",
    storage: "Fridge",
    daysLeft: 1,
    icon: <Apple className="h-6 w-6" />,
  },
  {
    id: 2,
    name: "Organic Carrots",
    quantity: "1kg",
    storage: "Fridge",
    daysLeft: 2,
    icon: <Carrot className="h-6 w-6" />,
  },
  {
    id: 3,
    name: "Milk (Unopened)",
    quantity: "1L",
    storage: "Fridge",
    daysLeft: 3,
    icon: <Milk className="h-6 w-6" />,
  },
  {
    id: 4,
    name: "Eggs",
    quantity: "6 pack",
    storage: "Fridge",
    daysLeft: 7,
    icon: <Egg className="h-6 w-6" />,
  },
];

const storageFilters = [
  { label: "All", value: "all", icon: PackageIcon },
  { label: "Fridge", value: "fridge", icon: Refrigerator },
  { label: "Freezer", value: "freezer", icon: Snowflake },
  { label: "Pantry", value: "pantry", icon: PackageIcon },
];

export default function MyFood() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addFoodOpen, setAddFoodOpen] = useState(false);

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft <= 1) return "bg-woodland text-primary-foreground";
    if (daysLeft <= 3) return "bg-secondary text-secondary-foreground";
    return "bg-muted text-muted-foreground";
  };

  const getProgressBarColor = (daysLeft: number) => {
    if (daysLeft <= 1) return "bg-woodland";
    if (daysLeft <= 3) return "bg-asparagus";
    return "bg-pine-glade";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-foreground mb-2">My Food Inventory</h1>
            <p className="text-muted-foreground">
              Manage your food items and track expiration dates
            </p>
          </div>
          <Dialog open={addFoodOpen} onOpenChange={setAddFoodOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-primary hover:bg-asparagus transition-colors">
                <Plus className="h-5 w-5 mr-2" />
                Add Food
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Food Item</DialogTitle>
                <DialogDescription>
                  Choose how you'd like to add your food
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Button className="w-full justify-start" variant="outline" size="lg">
                  <PackageIcon className="h-5 w-5 mr-3" />
                  Manual Entry
                </Button>
                <Button className="w-full justify-start" variant="outline" size="lg" disabled>
                  <span className="h-5 w-5 mr-3">📷</span>
                  Scan Barcode (Coming Soon)
                </Button>
                <Button className="w-full justify-start" variant="outline" size="lg" disabled>
                  <span className="h-5 w-5 mr-3">🤖</span>
                  Receipt Scan (Coming Soon)
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search food items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {storageFilters.map((filter) => {
              const Icon = filter.icon;
              return (
                <Button
                  key={filter.value}
                  variant={selectedFilter === filter.value ? "default" : "outline"}
                  onClick={() => setSelectedFilter(filter.value)}
                  className="whitespace-nowrap"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {filter.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Food Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockInventory.map((item) => (
            <Card key={item.id} className="p-6 hover:shadow-lg transition-all duration-300 hover-lift">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-primary">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.quantity}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Open Triage</DropdownMenuItem>
                    <DropdownMenuItem>Edit Details</DropdownMenuItem>
                    <DropdownMenuItem>Cook/Eat</DropdownMenuItem>
                    <DropdownMenuItem>Donate</DropdownMenuItem>
                    <DropdownMenuItem>Freeze</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.storage}</span>
                  <Badge className={getUrgencyColor(item.daysLeft)}>
                    {item.daysLeft === 1 ? "Use Today" : `${item.daysLeft} days left`}
                  </Badge>
                </div>
                
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getProgressBarColor(item.daysLeft)}`}
                    style={{ width: `${Math.max(10, (item.daysLeft / 7) * 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
