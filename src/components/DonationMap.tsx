import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { MapPin } from 'lucide-react';

interface DonationLocation {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
}

interface DonationMapProps {
  locations: DonationLocation[];
  onLocationClick?: (locationId: string) => void;
  selectedLocationId?: string;
}

export const DonationMap: React.FC<DonationMapProps> = ({ 
  locations, 
  onLocationClick,
  selectedLocationId 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState('');
  const [tokenSubmitted, setTokenSubmitted] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !tokenSubmitted) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283], // Center of US
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = [];
      map.current?.remove();
    };
  }, [mapboxToken, tokenSubmitted]);

  useEffect(() => {
    if (!map.current || !tokenSubmitted) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    locations.forEach(location => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.cursor = 'pointer';
      
      // Create marker color based on type
      const color = location.type === 'Food Bank' ? 'hsl(var(--woodland))' : 
                    location.type === 'Community Fridge' ? 'hsl(var(--asparagus))' : 
                    'hsl(var(--pine-glade))';
      
      el.innerHTML = `<svg width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3" fill="white"></circle>
      </svg>`;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        onLocationClick?.(location.id);
      });

      if (selectedLocationId === location.id) {
        el.style.transform = 'scale(1.2)';
      }

      markers.current.push(marker);
    });

    // Fit bounds to show all markers
    if (locations.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach(loc => bounds.extend([loc.lng, loc.lat]));
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [locations, selectedLocationId, onLocationClick, tokenSubmitted]);

  if (!tokenSubmitted) {
    return (
      <div className="relative w-full h-full bg-muted rounded-xl flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-4">
          <div className="flex items-center gap-2 text-woodland">
            <MapPin className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Map Setup Required</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter your Mapbox public token to view donation locations on the map. 
            Get your token at{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-woodland underline"
            >
              mapbox.com
            </a>
          </p>
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="pk.eyJ1Ijoi..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="font-mono text-xs"
            />
            <Button 
              onClick={() => setTokenSubmitted(true)}
              disabled={!mapboxToken}
              className="w-full"
            >
              Load Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-xl" />
    </div>
  );
};
