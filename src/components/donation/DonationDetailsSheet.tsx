import { MapPin, Phone, ExternalLink, Clock, Navigation2, Copy, CheckCircle2, XCircle } from "lucide-react";
import type { DonationLocation } from "@/components/donation/DonationMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";

interface DonationDetailsSheetProps {
  location: DonationLocation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDonate?: () => void;
}

const typeLabels: Record<DonationLocation["type"], string> = {
  food_bank: "Food Bank",
  community_fridge: "Community Fridge",
  pantry: "Pantry",
  shelter: "Shelter",
};

const typeColors: Record<DonationLocation["type"], string> = {
  food_bank: "bg-woodland text-white",
  community_fridge: "bg-asparagus text-white",
  pantry: "bg-pine-glade text-woodland",
  shelter: "bg-desert-sand text-woodland",
};

export function DonationDetailsSheet({
  location,
  open,
  onOpenChange,
  onDonate,
}: DonationDetailsSheetProps) {
  if (!location) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(location.address);
    toast({
      title: "Address copied",
      description: "Address copied to clipboard",
    });
  };

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`;
    window.open(url, "_blank");
  };

  const handleCall = () => {
    if (location.phone) {
      window.location.href = `tel:${location.phone}`;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <SheetTitle className="text-2xl text-woodland mb-2">
                {location.name}
              </SheetTitle>
              <Badge className={typeColors[location.type]}>
                {typeLabels[location.type]}
              </Badge>
            </div>
            <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none" />
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Distance */}
          {location.distanceLabel && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-asparagus" />
              <span>{location.distanceLabel} away</span>
            </div>
          )}

          {/* Address */}
          <section>
            <h3 className="text-sm font-semibold text-woodland mb-2">Address</h3>
            <p className="text-sm text-foreground mb-2">{location.address}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAddress}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Address
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetDirections}
                className="flex-1"
              >
                <Navigation2 className="w-4 h-4 mr-2" />
                Directions
              </Button>
            </div>
          </section>

          {/* Hours */}
          {location.hours && (
            <section>
              <h3 className="text-sm font-semibold text-woodland mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-asparagus" />
                Opening Hours
              </h3>
              <p className="text-sm text-muted-foreground">{location.hours}</p>
            </section>
          )}

          {/* Contact */}
          {(location.phone || location.website) && (
            <section>
              <h3 className="text-sm font-semibold text-woodland mb-2">Contact</h3>
              <div className="flex gap-2">
                {location.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCall}
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                )}
                {location.website && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(location.website, "_blank")}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Website
                  </Button>
                )}
              </div>
            </section>
          )}

          {/* Donation Policy */}
          <section>
            <h3 className="text-sm font-semibold text-woodland mb-3">Donation Policy</h3>
            
            {/* Accepts */}
            <div className="mb-4">
              <p className="text-xs font-medium text-asparagus mb-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Accepts
              </p>
              <div className="flex flex-wrap gap-2">
                {location.accepts.map((item, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-pine-glade/20 border-pine-glade text-woodland"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Does Not Accept */}
            {location.policy?.notAccepted && location.policy.notAccepted.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-destructive mb-2 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  Does Not Accept
                </p>
                <div className="flex flex-wrap gap-2">
                  {location.policy.notAccepted.map((item, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="bg-destructive/10 border-destructive/30 text-destructive"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {location.policy?.notes && (
              <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground">{location.policy.notes}</p>
              </div>
            )}
          </section>

          {/* Description */}
          {location.description && (
            <section>
              <h3 className="text-sm font-semibold text-woodland mb-2">About</h3>
              <p className="text-sm text-muted-foreground">{location.description}</p>
            </section>
          )}

          {/* Action Button */}
          <Button
            className="w-full bg-asparagus hover:bg-asparagus/90 text-white"
            size="lg"
            onClick={onDonate}
          >
            Mark as Donated
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
