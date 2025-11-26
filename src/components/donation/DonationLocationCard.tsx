import { useState } from "react";
import { MapPin, Phone, ExternalLink, Clock, CheckCircle2, Navigation2 } from "lucide-react";

import type { DonationLocation } from "@/components/donation/DonationMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DonationModal } from "./DonationModal";

interface DonationLocationCardProps {
  location: DonationLocation;
  selected?: boolean;
  onSelect?: (id: string) => void;
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

export function DonationLocationCard({ location, selected, onSelect }: DonationLocationCardProps) {
  const [showDonationModal, setShowDonationModal] = useState(false);

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`;
    window.open(url, "_blank");
  };

  const handleCall = () => {
    if (location.phone && location.phone !== "N/A") {
      window.location.href = `tel:${location.phone}`;
    }
  };

  return (
    <>
      <Card
        className={`transition-all cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 ${
          selected 
            ? "ring-2 ring-woodland bg-pine-glade/30 shadow-md" 
            : "hover:bg-card/80"
        }`}
        onClick={() => onSelect?.(location.id)}
        aria-pressed={selected}
        role="button"
        data-location-id={location.id}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg text-woodland">{location.name}</CardTitle>
              <CardDescription className="mt-1">
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="w-4 h-4" />
                  {location.distanceLabel ? `${location.distanceLabel} • ` : null}
                  {location.address}
                </div>
              </CardDescription>
            </div>
            <Badge className={typeColors[location.type]}>{typeLabels[location.type]}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {location.hours && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-asparagus" />
              <span className="text-muted-foreground">{location.hours}</span>
            </div>
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
