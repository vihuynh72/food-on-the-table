import { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Phone,
  ExternalLink,
  Clock,
  CheckCircle2,
  Navigation2,
  ImageOff,
  Star,
} from "lucide-react";

import type { DonationLocation } from "@/components/donation/DonationMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DonationModal } from "./DonationModal";
import { Skeleton } from "@/components/ui/skeleton";
import type { DonationLocationDetails } from "@/lib/donationLocationDetails";

interface DonationLocationCardProps {
  location: DonationLocation;
  selected?: boolean;
  onSelect?: (id: string) => Promise<void> | void;
  details?: DonationLocationDetails | null;
  loadingDetails?: boolean;
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

export function DonationLocationCard({
  location,
  selected,
  onSelect,
  details,
  loadingDetails,
}: DonationLocationCardProps) {
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [details?.heroImageUrl, location.id]);

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`;
    window.open(url, "_blank");
  };

  const handleCall = () => {
    if (location.phone && location.phone !== "N/A") {
      window.location.href = `tel:${location.phone}`;
    }
  };

  const statusBadge = useMemo(() => {
    if (loadingDetails) {
      return <Skeleton className="h-6 w-20 rounded-full" />;
    }

    if (details?.openNow === undefined) return null;

    return (
      <Badge variant={details.openNow ? "secondary" : "outline"} className="flex items-center gap-1 text-xs">
        <div className={`h-2 w-2 rounded-full ${details.openNow ? "bg-emerald-500" : "bg-amber-500"}`} />
        {details.openNow ? "Open now" : "Closed"}
      </Badge>
    );
  }, [details?.openNow, loadingDetails]);

  return (
    <>
      <Card
        className={`transition-all cursor-pointer hover:shadow-lg ${selected ? "ring-2 ring-woodland" : ""}`}
        onClick={() => {
          void Promise.resolve(onSelect?.(location.id));
        }}
        aria-pressed={selected}
        role="button"
        data-location-id={location.id}
      >
        <CardHeader className="space-y-3 pb-4">
          <div className="relative overflow-hidden rounded-xl border bg-muted/30">
            {loadingDetails ? (
              <Skeleton className="h-40 w-full rounded-none" />
            ) : details?.heroImageUrl && !imageError ? (
              <>
                {!imageLoaded && <Skeleton className="absolute inset-0 h-full w-full rounded-none" />}
                <img
                  src={details.heroImageUrl}
                  alt={`Exterior photo of ${location.name}`}
                  className={`h-40 w-full object-cover transition-opacity ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              </>
            ) : (
              <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-asparagus/20 to-woodland/30 text-woodland">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ImageOff className="h-5 w-5" />
                  No photo available
                </div>
              </div>
            )}

            {details?.mapUrl && (
              <Button
                variant="secondary"
                size="sm"
                className="absolute bottom-3 right-3 bg-background/90 text-woodland shadow"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(details.mapUrl, "_blank");
                }}
              >
                View on Google Maps
              </Button>
            )}
          </div>

          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-1">
              <CardTitle className="text-lg text-woodland">{location.name}</CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-1 text-sm">
                <MapPin className="w-4 h-4" />
                {location.distanceLabel ? `${location.distanceLabel} • ` : null}
                {location.address}
              </CardDescription>
              {details?.description ? (
                <p className="text-sm text-muted-foreground line-clamp-2">{details.description}</p>
              ) : loadingDetails ? (
                <Skeleton className="h-4 w-3/4" />
              ) : null}

              <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-muted-foreground">
                {statusBadge}
                {loadingDetails ? (
                  <Skeleton className="h-4 w-20" />
                ) : details?.rating ? (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    {details.rating.toFixed(1)} {details.reviewCount ? `(${details.reviewCount})` : null}
                  </span>
                ) : null}
                {!loadingDetails && details?.lastUpdated && (
                  <span className="text-xs text-muted-foreground">{details.lastUpdated}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={typeColors[location.type]}>{typeLabels[location.type]}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {location.hours && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-asparagus" />
              <span className="text-muted-foreground">{location.hours}</span>
            </div>
          )}

          {!details?.description && !loadingDetails && (
            <p className="text-sm text-muted-foreground">Additional details will appear here when available.</p>
          )}

          <div>
            <p className="text-sm font-medium text-woodland mb-2">Accepts:</p>
            <div className="flex flex-wrap gap-2">
              {location.accepts.map((item, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-asparagus" />
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={(e) => { e.stopPropagation(); handleGetDirections(); }}>
              <Navigation2 className="w-4 h-4 mr-2" />
              Directions
            </Button>
            {location.phone && location.phone !== "N/A" && (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCall();
                }}
                aria-label={`Call ${location.name}`}
              >
                <Phone className="w-4 h-4" />
              </Button>
            )}
            {location.website && (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(location.website, "_blank");
                }}
                aria-label={`Open website for ${location.name}`}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            )}
          </div>

          <Button
            variant="secondary"
            className="w-full bg-pine-glade text-woodland hover:bg-pine-glade/80"
            onClick={(e) => {
              e.stopPropagation();
              setShowDonationModal(true);
            }}
          >
            Mark as Donated
          </Button>
        </CardContent>
      </Card>

      <DonationModal
        open={showDonationModal}
        onOpenChange={setShowDonationModal}
        locationId={location.id}
        locationName={location.name}
      />
    </>
  );
}
