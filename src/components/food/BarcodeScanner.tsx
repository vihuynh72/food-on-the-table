import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, AlertCircle } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (data: { name?: string; category?: string; barcode: string }) => void;
  onCancel: () => void;
}

export function BarcodeScanner({ onScan, onCancel }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const scannerRef = useRef<unknown>(null);

  useEffect(() => {
    let mounted = true;

    const initScanner = async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        
        if (!mounted) return;

        const codeReader = new BrowserMultiFormatReader();
        scannerRef.current = codeReader;

        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setError("No camera found. Please ensure you have a camera connected.");
          setIsLoading(false);
          return;
        }

        // Prefer back camera on mobile
        const backCamera = videoInputDevices.find(
          (device) =>
            device.label.toLowerCase().includes("back") ||
            device.label.toLowerCase().includes("rear")
        );
        const deviceId = backCamera?.deviceId || videoInputDevices[0].deviceId;

        if (!videoRef.current) return;

        await codeReader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          async (result, err) => {
            if (result && mounted) {
              const barcode = result.getText();
              setIsLookingUp(true);
              
              // Look up product info from OpenFoodFacts
              try {
                const response = await fetch(
                  `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
                );
                const data = await response.json();

                if (data.status === 1 && data.product) {
                  const product = data.product;
                  onScan({
                    name: product.product_name || product.product_name_en || "",
                    category: product.categories_tags?.[0]?.replace("en:", "") || "",
                    barcode,
                  });
                } else {
                  // Product not found, just pass the barcode
                  onScan({ barcode });
                }
              } catch {
                // API error, just pass the barcode
                onScan({ barcode });
              }
            }

            if (err && err.name !== "NotFoundException") {
              console.error("Scanner error:", err);
            }
          }
        );

        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize scanner:", err);
        if (mounted) {
          setError("Failed to access camera. Please check permissions.");
          setIsLoading(false);
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        // Clean up scanner - cast to any since the type is complex
        const reader = scannerRef.current as { reset?: () => void };
        reader.reset?.();
      }
    };
  }, [onScan]);

  if (error) {
    return (
      <div className="py-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={onCancel}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {isLookingUp && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Looking up product...</p>
            </div>
          </div>
        )}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
        />
        {!isLoading && !isLookingUp && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-1/3 border-2 border-primary rounded-lg" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Camera className="h-4 w-4" />
        <span>Position the barcode within the frame</span>
      </div>

      <Button variant="outline" onClick={onCancel} className="w-full">
        Cancel
      </Button>
    </div>
  );
}
