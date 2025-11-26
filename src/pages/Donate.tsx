import { useEffect, useMemo, useRef, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { DonationMap, type DonationLocationType } from "@/components/donation/DonationMap";
import { DonationLocationCard } from "@/components/donation/DonationLocationCard";
import { DONATION_LOCATIONS } from "@/data/donationLocations";
import { useUserLocation } from "@/hooks/useUserLocation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/components/ui/use-toast";
import { MapPin } from "lucide-react";

const filterOptions: { label: string; value: DonationLocationType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Food Bank", value: "food_bank" },
  { label: "Community Fridge", value: "community_fridge" },
  { label: "Pantry", value: "pantry" },
  { label: "Shelter", value: "shelter" },
];

export default function Donate() {
  const [activeTypeFilter, setActiveTypeFilter] = useState<DonationLocationType | "all">("all");
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(DONATION_LOCATIONS[0]?.id);
  const { position, status, errorMessage, requestLocation } = useUserLocation();
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  const visibleLocations = useMemo(
    () =>
      activeTypeFilter === "all"
        ? DONATION_LOCATIONS
        : DONATION_LOCATIONS.filter((loc) => loc.type === activeTypeFilter),
    [activeTypeFilter],
  );

  useEffect(() => {
    if (status === "success") {
      toast({ title: "Location found", description: "Centering near you." });
    }
  }, [status]);

  const handleSelectFromCard = (id: string) => {
    setSelectedLocationId(id);
    if (window.innerWidth < 1024 && mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSelectFromMap = (id: string) => {
    setSelectedLocationId(id);
    const cardElement = document.querySelector(`[data-location-id="${id}"]`);
    if (cardElement instanceof HTMLElement) {
      cardElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold text-woodland mb-2">Donate Food Locally</h1>
          <p className="text-muted-foreground">Find nearby donation locations for your surplus food</p>
          <p className="text-sm text-muted-foreground">
            {visibleLocations.length} location{visibleLocations.length === 1 ? "" : "s"} found near you
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {filterOptions.map((option) => (
              <Button
                key={option.value}
                variant={activeTypeFilter === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTypeFilter(option.value)}
                className="whitespace-nowrap"
                aria-pressed={activeTypeFilter === option.value}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={requestLocation} className="ml-auto">
            Use my location
          </Button>
        </div>

        {status === "locating" && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> Finding your location…
          </div>
        )}
        {(status === "denied" || status === "error") && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            We couldn’t access your location. You can still browse donation centers or search by city/ZIP.
            <Button variant="outline" size="sm" onClick={requestLocation}>
              Retry
            </Button>
            {errorMessage && <span className="text-xs text-muted-foreground">{errorMessage}</span>}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div ref={mapSectionRef} className="h-[400px] lg:h-[600px] rounded-xl overflow-hidden border shadow-md">
            <DonationMap
              locations={DONATION_LOCATIONS}
              activeTypeFilter={activeTypeFilter}
              selectedLocationId={selectedLocationId}
              onSelectLocation={handleSelectFromMap}
              userPosition={position as google.maps.LatLngLiteral | null}
            />
          </div>

          <div className="space-y-4 lg:max-h-[600px] lg:overflow-y-auto">
            {visibleLocations.length === 0 && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-woodland">No locations found</CardTitle>
                  <CardDescription>Try another filter to discover more donation centers.</CardDescription>
                </CardHeader>
              </Card>
            )}
            {visibleLocations.map((location) => (
              <DonationLocationCard
                key={location.id}
                location={location}
                selected={selectedLocationId === location.id}
                onSelect={handleSelectFromCard}
              />
            ))}
          </div>
        </div>

        <Card className="border-asparagus/20">
          <CardHeader>
            <CardTitle className="text-woodland">Donation Guidelines</CardTitle>
            <CardDescription>What you need to know before donating</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-woodland">What items can I donate?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Sealed, unopened packaged foods</li>
                    <li>Canned goods within date</li>
                    <li>Fresh produce in good condition</li>
                    <li>Dry goods (rice, pasta, beans)</li>
                    <li>Sealed dairy products (check location)</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-woodland">What items cannot be donated?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Opened or unsealed packages</li>
                    <li>Homemade or prepared foods (varies by location)</li>
                    <li>Expired items past "use by" date</li>
                    <li>Items showing signs of spoilage</li>
                    <li>Alcohol or supplements</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-woodland">How should I prepare items for donation?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check all dates and ensure items are within guidelines</li>
                    <li>Keep items in original packaging when possible</li>
                    <li>Store cold items at safe temperatures during transport</li>
                    <li>Label items clearly if repackaged</li>
                    <li>Call ahead for large donations</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
