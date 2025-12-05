import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { usePickupConfirmation } from "@/hooks/usePickupConfirmation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, X, CheckCircle2, Clock, Sparkles } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/useWindowSize";

interface PickupConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interestId: string;
  postTitle: string;
  role: "giver" | "seeker";
  otherPartyName: string;
  alreadyConfirmed?: boolean;
}

export function PickupConfirmationModal({
  open,
  onOpenChange,
  interestId,
  postTitle,
  role,
  otherPartyName,
  alreadyConfirmed = false,
}: PickupConfirmationModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { confirmPickup, isConfirming } = usePickupConfirmation();
  const { width, height } = useWindowSize();
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

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

  const handleConfirm = async () => {
    if (!user) return;

    let photoUrl: string | undefined;

    // Upload photo if provided
    if (photoFile) {
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `pickups/${interestId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("community_images")
        .upload(fileName, photoFile);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from("community_images")
          .getPublicUrl(fileName);
        photoUrl = publicUrl;
      }
    }

    const result = await confirmPickup(interestId, role, photoUrl);

    if (result.success && result.completed) {
      setEarnedPoints(role === "giver" ? result.giver_points || 50 : result.seeker_points || 30);
      setShowCelebration(true);
      
      // Auto close after celebration
      setTimeout(() => {
        setShowCelebration(false);
        onOpenChange(false);
        clearPhoto();
      }, 4000);
    } else if (result.success) {
      onOpenChange(false);
      clearPhoto();
    }
  };

  return (
    <>
      {showCelebration && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />}
      
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          {showCelebration ? (
            <div className="text-center py-8 space-y-6 animate-fade-in">
              <div className="flex justify-center">
                <Sparkles className="h-16 w-16 text-asparagus animate-pulse" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-2xl text-woodland">Pickup Complete! 🎉</DialogTitle>
                <DialogDescription className="text-base">
                  You've made a difference in your community
                </DialogDescription>
              </DialogHeader>
              
              <div className="bg-pine-glade/30 rounded-lg p-6">
                <div className="text-4xl font-bold text-woodland">+{earnedPoints}</div>
                <div className="text-sm text-muted-foreground">Points Earned</div>
              </div>

              <p className="text-sm text-muted-foreground">
                {role === "giver" 
                  ? "Thank you for sharing food with your neighbor!"
                  : "Enjoy your food and help reduce waste!"}
              </p>
            </div>
          ) : alreadyConfirmed ? (
            <div className="text-center py-8 space-y-4">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto" />
              <DialogHeader>
                <DialogTitle>Waiting for Confirmation</DialogTitle>
                <DialogDescription>
                  You've already confirmed. Waiting for {otherPartyName} to confirm the pickup.
                </DialogDescription>
              </DialogHeader>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Confirm Pickup
                </DialogTitle>
                <DialogDescription>
                  Confirm that the pickup for "{postTitle}" has been completed
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    {role === "giver" 
                      ? `Confirm that ${otherPartyName} has picked up the food.`
                      : `Confirm that you've received the food from ${otherPartyName}.`}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Add Photo (optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Take a photo to verify the pickup
                  </p>
                  {photoPreview ? (
                    <div className="relative rounded-lg overflow-hidden border">
                      <img src={photoPreview} alt="Pickup preview" className="w-full h-48 object-cover" />
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
                        onClick={() => document.getElementById("pickup-photo-upload")?.click()}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => document.getElementById("pickup-photo-upload")?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  )}
                  <input
                    id="pickup-photo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    You'll earn {role === "giver" ? "50" : "30"} points when both parties confirm!
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleConfirm} disabled={isConfirming} className="flex-1">
                  {isConfirming ? "Confirming..." : "Confirm Pickup"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
