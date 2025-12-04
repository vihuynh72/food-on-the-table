
let googleMapsPromise: Promise<typeof google.maps> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<typeof google.maps> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window object"));
  
  if (window.google?.maps && "places" in window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      // Set up callback before loading script
      const windowWithInit = window as Window & { initGoogleMaps?: () => void };
      
      // If script is already loading/loaded by another source but promise is null
      if (window.google?.maps) {
        resolve(window.google.maps);
        return;
      }

      windowWithInit.initGoogleMaps = () => {
        if (window.google?.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error("Google Maps failed to load"));
        }
      };

      const scriptId = 'google-maps-script';
      if (document.getElementById(scriptId)) {
        // Script already exists, just wait for it
        const checkInterval = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(checkInterval);
            resolve(window.google.maps);
          }
        }, 100);
        return;
      }

      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error("Google Maps script could not be loaded"));
      document.head.appendChild(script);
    });
  }

  return googleMapsPromise;
}
