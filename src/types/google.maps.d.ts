export {}; // Ensure this file is treated as a module.

declare global {
  namespace google.maps {
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface MapOptions {
      center: LatLngLiteral;
      zoom?: number;
      mapTypeControl?: boolean;
      streetViewControl?: boolean;
      fullscreenControl?: boolean;
      styles?: google.maps.MapTypeStyle[];
    }

    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions);
      panTo(latLng: LatLngLiteral): void;
      setZoom(zoom: number): void;
      setCenter(latLng: LatLngLiteral): void;
      fitBounds(bounds: LatLngBounds, padding?: number | google.maps.Padding): void;
      getCenter(): LatLng | undefined;
      addListener(eventName: string, handler: (...args: unknown[]) => void): google.maps.MapsEventListener;
    }

    class Marker {
      constructor(opts?: google.maps.MarkerOptions);
      addListener(eventName: string, handler: (...args: unknown[]) => void): google.maps.MapsEventListener;
      setMap(map: Map | null): void;
    }

    interface MarkerOptions {
      position: LatLngLiteral;
      map?: Map | null;
      title?: string;
      icon?: Symbol;
    }

    class LatLngBounds {
      constructor(sw?: LatLngLiteral, ne?: LatLngLiteral);
      extend(point: LatLngLiteral): void;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    interface MapsEventListener {
      remove(): void;
    }

    interface MapTypeStyle {
      elementType?: string;
      featureType?: string;
      stylers?: Record<string, string | number>[];
    }

    interface Padding {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    }

    enum SymbolPath {
      BACKWARD_CLOSED_ARROW,
    }

    interface Symbol {
      path: SymbolPath;
      scale?: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeWeight?: number;
      strokeColor?: string;
    }

    namespace places {
      class PlacesService {
        constructor(attrContainer: HTMLElement);
        textSearch(
          request: TextSearchRequest,
          callback: (
            results: PlaceResult[] | null,
            status: PlacesServiceStatus
          ) => void
        ): void;
      }

      class Autocomplete {
        constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
        addListener(eventName: string, handler: () => void): google.maps.MapsEventListener;
        getPlace(): PlaceResult;
      }

      interface AutocompleteOptions {
        types?: string[];
        fields?: string[];
        componentRestrictions?: {
          country?: string | string[];
        };
      }

      interface TextSearchRequest {
        query: string;
        location?: LatLng;
        radius?: number;
      }

      interface PlaceResult {
        place_id?: string;
        name?: string;
        formatted_address?: string;
        geometry?: PlaceGeometry;
        types?: string[];
        opening_hours?: {
          weekday_text?: string[];
        };
      }

      interface PlaceGeometry {
        location: LatLng;
      }

      enum PlacesServiceStatus {
        OK = "OK",
        ZERO_RESULTS = "ZERO_RESULTS",
        INVALID_REQUEST = "INVALID_REQUEST",
        OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
        REQUEST_DENIED = "REQUEST_DENIED",
        UNKNOWN_ERROR = "UNKNOWN_ERROR",
      }
    }

    namespace event {
      function clearInstanceListeners(instance: any): void;
    }
  }

  interface Window {
    google: typeof google;
  }
}
