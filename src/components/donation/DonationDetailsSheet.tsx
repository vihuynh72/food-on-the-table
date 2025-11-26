import { MapPin, Phone, ExternalLink, Clock, Navigation2, Copy, CheckCircle2, XCircle, Star, Loader2 } from "lucide-react";
import type { DonationLocation } from "@/components/donation/DonationMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { toast } from "@/hooks/use-toast";
import type { PlaceDetailsResponse } from "@/lib/placeDetailsClient";

interface DonationDetailsSheetProps {
  location: DonationLocation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDonate?: () => void;
  placeDetails?: PlaceDetailsResponse | null;
  loadingPlaceDetails?: boolean;
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
  placeDetails,
  loadingPlaceDetails = false,
}: DonationDetailsSheetProps) {
  if (!location) return null;

  const addressToShow = placeDetails?.formattedAddress || location.address;
  const phoneToShow = placeDetails?.formattedPhoneNumber || location.phone;
  const websiteToShow = placeDetails?.websiteUri || location.website;
  const openingHours = placeDetails?.openingHoursText;
  const rating = placeDetails?.rating;
  const warning = placeDetails?.warning;
  const placeSource = placeDetails?.source;
  const openNow = placeDetails?.openNow;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(addressToShow);
    toast({
      title: "Address copied",
      description: "Address copied to clipboard",
    });
  };

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressToShow)}`;
    window.open(url, "_blank");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <SheetTitle className="text-2xl text-woodland mb-2">
                {placeDetails?.name || location.name}
              </SheetTitle>
              <Badge className={typeColors[location.type]}>
                {typeLabels[location.type]}
              </Badge>
            </div>
            <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none" />
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status */}
          <section className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {placeSource && (
              <span>Source: {placeSource}</span>
            )}
            {loadingPlaceDetails && (
              <span className="flex items-center gap-2 text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching latest info…
              </span>
            )}
            {openNow !== undefined && (
              <Badge variant={openNow ? "secondary" : "outline"} className="text-xs">
                <span className={`mr-1 inline-block h-2 w-2 rounded-full ${openNow ? "bg-emerald-500" : "bg-amber-500"}`} />
                {openNow ? "Open now" : "Closed"}
              </Badge>
            )}
            {rating && (
              <span className="flex items-center gap-1 text-sm text-foreground">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {rating.toFixed(1)} / 5
              </span>
            )}
          </section>

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
            <p className="text-sm text-foreground mb-2">{addressToShow}</p>
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
          {openingHours?.length ? (
            <section>
              <h3 className="text-sm font-semibold text-woodland mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-asparagus" />
                Hours
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {openingHours.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ) : location.hours ? (
            <section>
              <h3 className="text-sm font-semibold text-woodland mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-asparagus" />
                Opening Hours
              </h3>
              <p className="text-sm text-muted-foreground">{location.hours}</p>
            </section>
          ) : null}

          {/* Contact */}
          {(phoneToShow || websiteToShow) && (
            <section>
              <h3 className="text-sm font-semibold text-woodland mb-2">Contact</h3>
              {phoneToShow && (
                <p className="text-sm text-foreground mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-asparagus" />
                  <a
                    href={`tel:${phoneToShow.replace(/[^\d+]/g, "")}`}
                    className="text-asparagus hover:underline font-medium"
                  >
                    {phoneToShow}
                  </a>
                </p>
              )}
              <div className="flex gap-2">
                {phoneToShow && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      navigator.clipboard.writeText(phoneToShow);
                      toast({
                        title: "Phone number copied",
                        description: `${phoneToShow} copied to clipboard`,
                      });
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Phone
                  </Button>
                )}
                {websiteToShow && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <a href={websiteToShow} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Website
                    </a>
                  </Button>
                )}
              </div>
            </section>
          )}

          {warning && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              {warning}
            </div>
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
