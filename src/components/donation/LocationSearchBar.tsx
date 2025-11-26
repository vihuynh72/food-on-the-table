import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface LocationSearchBarProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
}

export function LocationSearchBar({ onLocationSelect }: LocationSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for Google Maps to be loaded
    const checkGoogleMaps = setInterval(() => {
      if (window.google?.maps?.places) {
        setIsReady(true);
        clearInterval(checkGoogleMaps);
      }
    }, 100);

    return () => clearInterval(checkGoogleMaps);
  }, []);

  useEffect(() => {
    if (!isReady || !inputRef.current || !window.google?.maps?.places) return;

    try {
      // Initialize autocomplete
      const AutocompleteConstructor = (window.google.maps.places as any).Autocomplete;
      autocompleteRef.current = new AutocompleteConstructor(inputRef.current, {
        types: ["geocode"],
        fields: ["geometry", "formatted_address", "name"],
      });

      // Listen for place selection
      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace();
        
        if (!place?.geometry?.location) {
          toast({
            title: "Location not found",
            description: "Please select a valid location from the dropdown",
            variant: "destructive",
          });
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || place.name || "Selected location";

        onLocationSelect({ lat, lng, address });
        
        toast({
          title: "Location updated",
          description: `Searching near ${address}`,
        });
      });
    } catch (error) {
      console.error("Error initializing autocomplete:", error);
    }

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        (window.google.maps.event as any).clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isReady, onLocationSelect]);

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <MapPin className="h-4 w-4" />
      </div>
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search by city, ZIP code, or address..."
        className="pl-9 pr-10"
        disabled={!isReady}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <Search className="h-4 w-4" />
      </div>
    </div>
  );
}
