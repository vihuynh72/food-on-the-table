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
  }

  interface Window {
    google: typeof google;
  }
}
