import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ChefHat, Clock, Users, Flame, ArrowLeft, Sparkles, Utensils, CheckCircle2, Lightbulb, X, Filter, CheckSquare, Download, Printer } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { generateRecipeFromIngredients, type Recipe } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useFoodInventory, FoodItem } from "@/hooks/useFoodInventory";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function RecipeGenerator() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { batchDeleteItems } = useFoodInventory();
  
  const [ingredients, setIngredients] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sourceItems, setSourceItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  
  // New options state
  const [cuisine, setCuisine] = useState<string>("any");
  const [cookingTime, setCookingTime] = useState<string>("any");
  const [dietary, setDietary] = useState<string>("none");

  // Consumption tracking
  const [showConsumeDialog, setShowConsumeDialog] = useState(false);
  const [itemsToConsume, setItemsToConsume] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (location.state?.ingredients) {
      const initialIngredients = location.state.ingredients;
      // Handle both string[] (legacy) and FoodItem[] (new)
      if (Array.isArray(initialIngredients)) {
        if (initialIngredients.length > 0 && typeof initialIngredients[0] === 'object') {
          const items = initialIngredients as FoodItem[];
          setSourceItems(items);
          setSelectedTags(items.map(i => i.name));
          // Default all to be consumed
          setItemsToConsume(new Set(items.map(i => i.id)));
        } else {
          setSelectedTags(initialIngredients as string[]);
        }
      }
    }
  }, [location.state]);

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
    // Also remove from source items if present
    const itemToRemove = sourceItems.find(i => i.name === tag);
    if (itemToRemove) {
      setSourceItems(sourceItems.filter(i => i.id !== itemToRemove.id));
      const newConsume = new Set(itemsToConsume);
      newConsume.delete(itemToRemove.id);
      setItemsToConsume(newConsume);
    }
  };

  const handleCooked = async () => {
    if (sourceItems.length === 0) {
      toast({
        title: "No tracked items",
        description: "This recipe wasn't generated from tracked inventory items.",
      });
      return;
    }
    setShowConsumeDialog(true);
  };

  const confirmConsumption = async () => {
    try {
      const idsToDelete = Array.from(itemsToConsume);
      if (idsToDelete.length > 0) {
        await batchDeleteItems(idsToDelete);
        toast({
          title: "Inventory Updated",
          description: `Removed ${idsToDelete.length} items from your inventory.`,
        });
      }
      setShowConsumeDialog(false);
      navigate("/");
    } catch (error) {
      console.error("Failed to update inventory", error);
      toast({
        title: "Error",
        description: "Failed to update inventory. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleConsumeItem = (id: string) => {
    const newSet = new Set(itemsToConsume);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setItemsToConsume(newSet);
  };

  const handleDownload = () => {
    if (!recipe) return;

    const content = `
${recipe.title}

COOKING TIME: ${recipe.cookingTime || 'N/A'}

INGREDIENTS:
${recipe.ingredients.join('\n')}

INSTRUCTIONS:
${recipe.instructions.map((step, i) => `${i + 1}. ${step.replace(/\*\*/g, '')}`).join('\n\n')}

${recipe.tips ? `\nCHEF'S TIPS:\n${recipe.tips.join('\n')}` : ''}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipe.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Recipe Downloaded",
      description: "Your recipe has been saved to your device.",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerate = async () => {
    const allIngredients = [...selectedTags];
    
    // Add current input if it's not empty
    if (ingredients.trim()) {
      allIngredients.push(ingredients.trim());
    }

    if (allIngredients.length === 0) {
      toast({
        title: "No ingredients provided",
        description: "Please enter some ingredients to generate a recipe.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setRecipe(null);

    try {
      const result = await generateRecipeFromIngredients(allIngredients, {
        cuisine,
        cookingTime,
        dietary: dietary !== "none" ? [dietary] : undefined
      });
      setRecipe(result);
      toast({
        title: "Recipe generated!",
        description: "Here is a recipe based on your ingredients.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate recipe. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-6 pl-0 hover:bg-transparent hover:text-primary" 
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">AI Recipe Generator</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Customize your preferences and let our AI chef create a delicious recipe for you.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
            <Card className="border-2 border-primary/20 shadow-lg h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-primary" />
                  Ingredients
                </CardTitle>
                <CardDescription>
                  What's in your pot? Add more if needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTags.length > 0 && (
                  <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
                      From your Cooking Pot
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="pl-3 pr-1 py-1 text-sm bg-background border-primary/20 text-foreground hover:bg-background"
                        >
                          {tag}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 hover:bg-destructive/10 hover:text-destructive rounded-full"
                            onClick={() => handleRemoveTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="ingredients">Add more ingredients</Label>
                  <div className="relative">
                    <input
                      id="ingredients"
                      type="text"
                      placeholder="Type ingredient and press Enter..."
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const val = ingredients.trim();
                          if (val && !selectedTags.includes(val)) {
                            setSelectedTags([...selectedTags, val]);
                            setIngredients("");
                          }
                        }
                      }}
                      className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">Enter</kbd> to add
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cuisine Style</Label>
                  <Select value={cuisine} onValueChange={setCuisine}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Style</SelectItem>
                      <SelectItem value="Italian">Italian</SelectItem>
                      <SelectItem value="Mexican">Mexican</SelectItem>
                      <SelectItem value="Asian">Asian</SelectItem>
                      <SelectItem value="Indian">Indian</SelectItem>
                      <SelectItem value="Mediterranean">Mediterranean</SelectItem>
                      <SelectItem value="American">American</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cooking Time</Label>
                  <Select value={cookingTime} onValueChange={setCookingTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Time</SelectItem>
                      <SelectItem value="Under 15 mins">Under 15 mins</SelectItem>
                      <SelectItem value="Under 30 mins">Under 30 mins</SelectItem>
                      <SelectItem value="Under 1 hour">Under 1 hour</SelectItem>
                      <SelectItem value="Slow Cook">Slow Cook (1hr+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dietary</Label>
                  <Select value={dietary} onValueChange={setDietary}>
                    <SelectTrigger>
                      <SelectValue placeholder="No Restrictions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Restrictions</SelectItem>
                      <SelectItem value="Vegetarian">Vegetarian</SelectItem>
                      <SelectItem value="Vegan">Vegan</SelectItem>
                      <SelectItem value="Gluten-Free">Gluten-Free</SelectItem>
                      <SelectItem value="Keto">Keto</SelectItem>
                      <SelectItem value="Paleo">Paleo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleGenerate} 
                  className="w-full mt-4" 
                  size="lg"
                  disabled={loading || (selectedTags.length === 0 && !ingredients)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Recipe
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {recipe && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8">
              <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-b from-card to-muted/30">
                <div className="h-2 bg-primary w-full" />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-3xl font-bold text-primary mb-2">
                        {recipe.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-4">
                        <div className="flex items-center gap-1 bg-background px-3 py-1 rounded-full border shadow-sm">
                          <Clock className="h-4 w-4 text-primary" />
                          {recipe.cookingTime}
                        </div>
                        <div className="flex items-center gap-1 bg-background px-3 py-1 rounded-full border shadow-sm">
                          <Users className="h-4 w-4 text-primary" />
                          {recipe.servings} servings
                        </div>
                        <div className="flex items-center gap-1 bg-background px-3 py-1 rounded-full border shadow-sm">
                          <Flame className="h-4 w-4 text-primary" />
                          {recipe.calories || "N/A"} cal
                        </div>
                        <div className="flex items-center gap-1 bg-background px-3 py-1 rounded-full border shadow-sm">
                          <span className="font-semibold text-primary mr-1">Difficulty:</span>
                          {recipe.difficulty}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 print:hidden">
                      <Button variant="outline" size="icon" onClick={handlePrint} title="Print Recipe">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleDownload} title="Download Text">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                  {/* Ingredients Section */}
                  <div className="bg-background/50 p-6 rounded-xl border shadow-sm">
                    <h3 className="font-semibold text-xl flex items-center gap-2 mb-6 text-foreground">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Utensils className="h-5 w-5 text-primary" />
                      </div>
                      Ingredients
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                      {recipe.ingredients.map((ingredient, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-foreground/90 group p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="mt-1">
                            <div className="h-2 w-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                          </div>
                          <span className="text-base font-medium">{ingredient}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Instructions Section */}
                  <div className="bg-background/50 p-6 rounded-xl border shadow-sm">
                    <h3 className="font-semibold text-xl flex items-center gap-2 mb-6 text-foreground">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <ChefHat className="h-5 w-5 text-primary" />
                      </div>
                      Instructions
                    </h3>
                    <div className="space-y-8">
                      {recipe.instructions.map((step, idx) => (
                        <div key={idx} className="flex gap-4 text-foreground/90 relative group">
                          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-lg border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                            {idx + 1}
                          </div>
                          <div className="pt-1.5">
                            <p className="text-lg leading-relaxed" dangerouslySetInnerHTML={{ 
                              __html: step.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-primary">$1</span>') 
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tips Section */}
                  {recipe.tips && recipe.tips.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-xl border border-amber-200 dark:border-amber-800/30">
                      <h3 className="font-semibold text-xl flex items-center gap-2 mb-4 text-amber-800 dark:text-amber-400">
                        <Lightbulb className="h-5 w-5" />
                        Chef's Tips
                      </h3>
                      <ul className="grid md:grid-cols-2 gap-4">
                        {recipe.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-amber-900/80 dark:text-amber-200/80">
                            <span className="mt-2 w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                            <span className="text-sm font-medium leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
                
                {/* "I Cooked This" Action Bar */}
                <div className="p-6 bg-primary/5 border-t border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Did you make this recipe?</p>
                    <p>Mark items as consumed to update your inventory automatically.</p>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto shadow-lg hover:scale-105 transition-transform"
                    onClick={handleCooked}
                  >
                    <CheckSquare className="mr-2 h-5 w-5" />
                    I Cooked This!
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Dialog open={showConsumeDialog} onOpenChange={setShowConsumeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
            <DialogDescription>
              Select the items you used for this recipe to remove them from your inventory.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {sourceItems.map((item) => (
              <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <Checkbox 
                  id={`consume-${item.id}`} 
                  checked={itemsToConsume.has(item.id)}
                  onCheckedChange={() => toggleConsumeItem(item.id)}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor={`consume-${item.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {item.name}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} • {item.storage}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConsumeDialog(false)}>Cancel</Button>
            <Button onClick={confirmConsumption}>Confirm & Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
