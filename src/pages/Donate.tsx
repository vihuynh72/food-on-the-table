import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { DonationMap, type DonationLocationType, type DonationLocation } from "@/components/donation/DonationMap";
import { DonationLocationCard } from "@/components/donation/DonationLocationCard";
import { DonationDetailsSheet } from "@/components/donation/DonationDetailsSheet";
import { LocationSearchBar } from "@/components/donation/LocationSearchBar";
import { useUserLocation } from "@/hooks/useUserLocation";
import { usePlacesSearch } from "@/hooks/usePlacesSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/components/ui/use-toast";
import { MapPin, Info, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { buildFallbackDetails, fetchPlaceDetails, type PlaceDetailsResponse } from "@/lib/placeDetailsClient";
import { fetchDonationLocationDetails, type DonationLocationDetails } from "@/lib/donationLocationDetails";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSliderWithInput } from "@/components/hooks/use-slider-with-input";

const filterOptions: { label: string; value: DonationLocationType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Food Bank", value: "food_bank" },
  { label: "Community Fridge", value: "community_fridge" },
  { label: "Pantry", value: "pantry" },
  { label: "Shelter", value: "shelter" },
];

const MIN_RADIUS_MILES = 1;
const MAX_RADIUS_MILES = 50;
const DEFAULT_RADIUS_MILES = 10;
const MILES_TO_METERS = 1609.34;

export default function Donate() {
  const [activeTypeFilter, setActiveTypeFilter] = useState<DonationLocationType | "all">("all");
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(undefined);
  const [selectedLocationDetails, setSelectedLocationDetails] = useState<PlaceDetailsResponse | null>(null);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isManualSearching, setIsManualSearching] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [locationDetails, setLocationDetails] = useState<Record<string, DonationLocationDetails | null>>({});
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
  const {
    sliderValue: distanceSliderValue,
    inputValues: distanceInputValues,
    validateAndUpdateValue: validateDistanceInput,
    handleInputChange: handleDistanceInputChange,
    handleSliderChange: handleDistanceSliderChange,
  } = useSliderWithInput({
    minValue: MIN_RADIUS_MILES,
    maxValue: MAX_RADIUS_MILES,
    initialValue: [DEFAULT_RADIUS_MILES],
    defaultValue: [DEFAULT_RADIUS_MILES],
  });
  const radiusMiles = distanceSliderValue[0] ?? DEFAULT_RADIUS_MILES;
  const radiusInputValue = distanceInputValues[0] ?? radiusMiles.toString();
  const radiusMeters = useMemo(() => radiusMiles * MILES_TO_METERS, [radiusMiles]);
  const { position, status, errorMessage, requestLocation } = useUserLocation();
  const [searchCenter, setSearchCenter] = useState<google.maps.LatLngLiteral | null>(null);
  const { locations, isLoading: isSearching, error: searchError, searchArea } = usePlacesSearch({
    location: position,
    radius: radiusMeters,
    enabled: status === "success",
  });
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const effectiveLocations = useMemo(() => locations, [locations]);

  const visibleLocations = useMemo(
    () =>
      activeTypeFilter === "all"
        ? effectiveLocations
        : effectiveLocations.filter((loc) => loc.type === activeTypeFilter),
    [activeTypeFilter, effectiveLocations],
  );

  const selectedLocation = useMemo(
    () => effectiveLocations.find((loc) => loc.id === selectedLocationId),
    [effectiveLocations, selectedLocationId],
  );

  const fetchDetailsForLocation = useCallback(
    async (location: DonationLocation) => {
      const cached = queryClient.getQueryData<PlaceDetailsResponse>(["place-details", location.id]);
      if (cached) {
        setSelectedLocationDetails(cached);
        return;
      }

      setIsFetchingDetails(true);
      try {
        const details = await queryClient.fetchQuery({
          queryKey: ["place-details", location.id],
          queryFn: () =>
            fetchPlaceDetails({
              placeId: location.placeId,
              name: location.name,
              lat: location.lat,
              lng: location.lng,
              address: location.address,
            }),
          staleTime: 1000 * 60 * 60,
        });
        setSelectedLocationDetails(details);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load place details";
        const fallback = buildFallbackDetails(
          {
            placeId: location.placeId,
            name: location.name,
            lat: location.lat,
            lng: location.lng,
            address: location.address,
          },
          message,
        );
        queryClient.setQueryData(["place-details", location.id], fallback);
        setSelectedLocationDetails(fallback);
        toast({
          title: "Using basic location info",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsFetchingDetails(false);
      }
    },
    [queryClient],
  );

  useEffect(() => {
    if (status === "success") {
      toast({ title: "Location found", description: "Centering near you." });
    }
  }, [status]);

  // Fetch details for visible location cards
  useEffect(() => {
    visibleLocations.forEach((location) => {
      if (locationDetails[location.id] || loadingDetails.has(location.id)) return;

      setLoadingDetails((prev) => new Set(prev).add(location.id));

      // Pass both ID and location object so we can generate fallback details
      fetchDonationLocationDetails(location.id, location)
        .then((details) => {
          setLocationDetails((prev) => ({ ...prev, [location.id]: details }));
        })
        .finally(() => {
          setLoadingDetails((prev) => {
            const next = new Set(prev);
            next.delete(location.id);
            return next;
          });
        });
    });
  }, [locationDetails, loadingDetails, visibleLocations]);

  const handleLocationSelection = useCallback(
    async (id: string, scrollTarget?: "map" | "card") => {
      setSelectedLocationId(id);
      setSelectedLocationDetails(null);
      const location = effectiveLocations.find((loc) => loc.id === id);
      if (!location) {
        toast({
          title: "Location unavailable",
          description: "We couldn't find details for that marker.",
          variant: "destructive",
        });
        return;
      }

      await fetchDetailsForLocation(location);
      setDetailsOpen(true);

      if (scrollTarget === "map" && window.innerWidth < 1024 && mapSectionRef.current) {
        mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (scrollTarget === "card") {
        const cardElement = document.querySelector(`[data-location-id="${id}"]`);
        if (cardElement instanceof HTMLElement) {
          cardElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    },
    [effectiveLocations, fetchDetailsForLocation],
  );

  const handleSelectFromCard = (id: string) => handleLocationSelection(id, "map");

  const handleSelectFromMap = (id: string) => handleLocationSelection(id, "card");

  const handleSearchArea = useCallback(
    async (center: google.maps.LatLngLiteral, overrideRadius?: number) => {
      setSearchCenter(center);
      setIsManualSearching(true);
      try {
        await searchArea(center, overrideRadius ?? radiusMeters);
        toast({
          title: "Search updated",
          description: "Found donation centers in this area",
        });
      } catch (err) {
        toast({
          title: "Search failed",
          description: "Could not search this area. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsManualSearching(false);
      }
    },
    [radiusMeters, searchArea],
  );

  const handleLocationSelect = useCallback(
    async (location: { lat: number; lng: number; address: string }) => {
      const center = { lat: location.lat, lng: location.lng };
      setSearchCenter(center);
      setIsManualSearching(true);
      try {
        await searchArea(center, radiusMeters);
      } catch (err) {
        toast({
          title: "Search failed",
          description: "Could not search this location. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsManualSearching(false);
      }
    },
    [radiusMeters, searchArea],
  );

  const handleDonate = () => {
    toast({
      title: "Donation logged",
      description: `Thank you for donating to ${selectedLocation?.name}!`,
    });
    setDetailsOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-woodland mb-2">Donate Food Locally</h1>
          <p className="text-base text-muted-foreground max-w-3xl">
            Find nearby food banks, community fridges, and pantries, and check what they accept before you go.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border/50">
            <Info className="w-4 h-4 text-asparagus flex-shrink-0" />
            <p>
              Showing <span className="font-semibold text-woodland">{visibleLocations.length}</span> donation location{visibleLocations.length === 1 ? "" : "s"} near you
            </p>
          </div>
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
        {isSearching && (
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching for nearby donation centers…
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
        {searchError && (
          <div className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Error searching for locations: {searchError}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4" ref={mapSectionRef}>
            <LocationSearchBar onLocationSelect={handleLocationSelect} />
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label htmlFor="distance-slider" className="text-woodland">
                    Search radius
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Adjust to widen or narrow donation center results (miles)
                  </p>
                </div>
                <span className="text-sm font-semibold text-woodland">{radiusMiles.toFixed(0)} mi</span>
              </div>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Slider
                  id="distance-slider"
                  className="grow"
                  value={distanceSliderValue}
                  min={MIN_RADIUS_MILES}
                  max={MAX_RADIUS_MILES}
                  step={1}
                  onValueChange={handleDistanceSliderChange}
                  aria-label="Search radius in miles"
                  showTooltip
                  tooltipContent={(value) => `${value} mi`}
                />
                <div className="flex items-center gap-2">
                  <Input
                    className="h-9 w-20"
                    type="text"
                    inputMode="decimal"
                    value={radiusInputValue}
                    onChange={(e) => handleDistanceInputChange(e, 0)}
                    onBlur={() => validateDistanceInput(radiusInputValue, 0)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        validateDistanceInput(radiusInputValue, 0);
                      }
                    }}
                    aria-label="Enter search radius in miles"
                  />
                  <span className="text-xs text-muted-foreground">mi</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Google Places limits each search to roughly 31 miles. Larger selections will pull the widest area allowed.
              </p>
            </div>
            
            <div className="h-[400px] lg:h-[520px] rounded-xl overflow-hidden border shadow-md">
              <DonationMap
                locations={visibleLocations}
                activeTypeFilter={activeTypeFilter}
                selectedLocationId={selectedLocationId}
                onSelectLocation={handleSelectFromMap}
                userPosition={position as google.maps.LatLngLiteral | null}
                searchCenter={searchCenter}
                onSearchArea={handleSearchArea}
                isSearching={isManualSearching}
                searchRadiusMeters={radiusMeters}
              />
            </div>
          </div>

          <div className="relative min-h-[600px] lg:min-h-0">
            <div className="absolute inset-0 overflow-y-auto space-y-4 pr-2 pb-2">
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
                  details={locationDetails[location.id]}
                  loadingDetails={loadingDetails.has(location.id)}
                  onSelect={handleSelectFromCard}
                />
              ))}
            </div>
          </div>
        </div>

        <DonationDetailsSheet
          location={selectedLocation}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onDonate={handleDonate}
          placeDetails={selectedLocationDetails}
          loadingPlaceDetails={isFetchingDetails}
        />

        <Card className="border-asparagus/20 bg-gradient-to-br from-card to-muted/30">
          <CardHeader>
            <CardTitle className="text-woodland">Donation Guidelines</CardTitle>
            <CardDescription>Important tips before you donate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border/50">
              <p className="text-sm text-muted-foreground">
                💡 <strong className="text-woodland">Tip:</strong> Always double-check the location's website or call ahead if you're unsure what they accept.
              </p>
            </div>
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
