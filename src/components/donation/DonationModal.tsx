import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Camera, Upload, X, Sparkles } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/useWindowSize";

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  locationName: string;
}

export function DonationModal({ open, onOpenChange, locationId, locationName }: DonationModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [foodItemName, setFoodItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [donationStats, setDonationStats] = useState<{
    points: number;
    foodKg: number;
    co2Kg: number;
    moneySaved: number;
  } | null>(null);
  const { width, height } = useWindowSize();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Photo must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to log donations",
        variant: "destructive",
      });
      onOpenChange(false);
      navigate("/auth");
      return;
    }
    
    if (!foodItemName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter the food item name",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {

      let photoUrl = null;

      // Upload photo if provided
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('donation-photos')
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('donation-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrl;
      }

      // Calculate impact based on quantity (rough estimates)
      const quantityNum = parseFloat(quantity) || 1;
      const impactKg = quantityNum * 1.0;
      const impactCo2 = impactKg * 2.5;
      const impactMoney = impactKg * 5.0;
      const pointsEarned = Math.round(impactKg * 10);

      // Insert donation record
      const { error: donationError } = await supabase
        .from('donations')
        .insert({
          user_id: user.id,
          food_item_name: foodItemName,
          quantity: quantity || null,
          location_id: locationId,
          location_name: locationName,
          photo_url: photoUrl,
          points_earned: pointsEarned,
          impact_kg: impactKg,
          impact_co2: impactCo2,
          impact_money: impactMoney,
        });

      if (donationError) throw donationError;

      // Show celebration
      setDonationStats({
        points: pointsEarned,
        foodKg: impactKg,
        co2Kg: impactCo2,
        moneySaved: impactMoney,
      });
      setShowCelebration(true);

      toast({
        title: "Donation logged! 🎉",
        description: `You earned ${pointsEarned} points!`,
      });

      // Auto-close celebration after 5 seconds
      setTimeout(() => {
        setShowCelebration(false);
        onOpenChange(false);
        resetForm();
      }, 5000);

    } catch (error: unknown) {
      console.error("Error logging donation:", error);
      const message = error instanceof Error ? error.message : "Failed to log donation. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFoodItemName("");
    setQuantity("");
    setNotes("");
    clearPhoto();
    setIsSubmitting(false);
    setDonationStats(null);
  };

  return (
    <>
      {showCelebration && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      
      <Dialog open={open} onOpenChange={(open) => {
        if (!open) resetForm();
        onOpenChange(open);
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {showCelebration && donationStats ? (
            <div className="text-center py-8 space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <Sparkles className="h-16 w-16 text-asparagus animate-pulse" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl text-woodland">Amazing Work! 🎉</DialogTitle>
                <DialogDescription className="text-base">
                  You've made a real difference today
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="bg-pine-glade/30 rounded-lg p-4">
                  <div className="text-3xl font-bold text-woodland">{donationStats.points}</div>
                  <div className="text-sm text-muted-foreground">Points Earned</div>
                </div>
                <div className="bg-pine-glade/30 rounded-lg p-4">
                  <div className="text-3xl font-bold text-woodland">{donationStats.foodKg.toFixed(1)}kg</div>
                  <div className="text-sm text-muted-foreground">Food Saved</div>
                </div>
                <div className="bg-pine-glade/30 rounded-lg p-4">
                  <div className="text-3xl font-bold text-woodland">{donationStats.co2Kg.toFixed(1)}kg</div>
                  <div className="text-sm text-muted-foreground">CO₂ Reduced</div>
                </div>
                <div className="bg-pine-glade/30 rounded-lg p-4">
                  <div className="text-3xl font-bold text-woodland">${donationStats.moneySaved.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Value Saved</div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Your donation helps feed families and reduces environmental impact
              </p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-woodland">Mark as Donated</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                Log your donation to {locationName}
              </DialogDescription>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="foodItem">Food Item *</Label>
                  <Input
                    id="foodItem"
                    placeholder="e.g., Canned beans, Fresh vegetables"
                    value={foodItemName}
                    onChange={(e) => setFoodItemName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity (optional)</Label>
                  <Input
                    id="quantity"
                    placeholder="e.g., 2kg, 5 cans, 3 bags"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Photo (optional)</Label>
                  {photoPreview ? (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img src={photoPreview} alt="Donation preview" className="w-full h-48 object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={clearPhoto}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  )}
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Logging..." : "Log Donation"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
