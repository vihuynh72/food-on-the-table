import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, X, ArrowRight, Soup, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

import { FoodItem } from "@/hooks/useFoodInventory";

interface CookingPotProps {
  items: FoodItem[];
  onRemoveItem: (itemId: string) => void;
  onClear: () => void;
}

export function CookingPot({ items, onRemoveItem, onClear }: CookingPotProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleGenerate = () => {
    navigate("/recipe-generator", { state: { ingredients: items } });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 bg-card border border-border shadow-2xl rounded-2xl w-80 overflow-hidden pointer-events-auto"
          >
            <div className="p-4 bg-primary/5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Soup className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Cooking Pot</h3>
                <Badge variant="secondary" className="ml-2">
                  {items.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-64 p-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center space-y-2">
                  <Soup className="h-12 w-12 opacity-20" />
                  <p className="text-sm">Your pot is empty.</p>
                  <p className="text-xs">Add items from your inventory to start cooking!</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between bg-background p-2 rounded-lg border border-border/50 shadow-sm"
                    >
                      <span className="text-sm font-medium truncate flex-1 mr-2">
                        {item.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </motion.li>
                  ))}
                </ul>
              )}
            </ScrollArea>

            <div className="p-4 border-t border-border bg-muted/20 space-y-2">
              <Button
                className="w-full gap-2"
                onClick={handleGenerate}
              >
                <ChefHat className="h-4 w-4" />
                Generate Recipe
              </Button>
              {items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-destructive"
                  onClick={onClear}
                >
                  Empty Pot
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-end pointer-events-auto group/pot">
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "mr-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-xl border shadow-lg text-sm font-medium transition-all duration-300",
            items.length > 0 ? "text-primary border-primary/20" : "text-muted-foreground",
            isOpen ? "opacity-0 translate-x-4 pointer-events-none" : "opacity-100"
          )}
        >
          {items.length === 0 ? "Drag food here to cook! 🍲" : `${items.length} items ready`}
        </motion.div>

        <motion.button
          layout
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "relative flex items-center justify-center w-20 h-20 rounded-full shadow-2xl transition-all duration-300 border-4",
            items.length > 0 
              ? "bg-primary text-primary-foreground border-primary/50 hover:bg-primary/90 hover:scale-110" 
              : "bg-card text-muted-foreground hover:bg-muted border-border hover:border-primary/50",
            isOpen && "rotate-180 bg-muted text-foreground border-border"
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Soup className={cn("h-10 w-10 transition-all duration-300", isOpen && "scale-0 absolute")} />
          <X className={cn("h-8 w-8 transition-all duration-300 absolute scale-0", isOpen && "scale-100")} />
          
          {items.length > 0 && !isOpen && (
            <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-xs font-bold text-white shadow-lg border-2 border-background animate-in zoom-in">
              {items.length}
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}
