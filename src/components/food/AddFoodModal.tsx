import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Package as PackageIcon, ScanBarcode, Receipt } from "lucide-react";
import { ManualFoodForm } from "./ManualFoodForm";
import { BarcodeScanner } from "./BarcodeScanner";
import type { FoodItemInsert } from "@/hooks/useFoodInventory";

type EntryMethod = "select" | "manual" | "barcode" | "receipt";

interface AddFoodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (item: FoodItemInsert) => Promise<unknown>;
}

export function AddFoodModal({ open, onOpenChange, onSubmit }: AddFoodModalProps) {
  const [step, setStep] = useState<EntryMethod>("select");
  const [barcodeData, setBarcodeData] = useState<{ name?: string; category?: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setStep("select");
    setBarcodeData(null);
    onOpenChange(false);
  };

  const handleSubmit = async (item: FoodItemInsert) => {
    setIsSubmitting(true);
    try {
      await onSubmit(item);
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBarcodeScanned = (data: { name?: string; category?: string; barcode: string }) => {
    setBarcodeData(data);
    setStep("manual");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "select" && "Add Food Item"}
            {step === "manual" && "Enter Food Details"}
            {step === "barcode" && "Scan Barcode"}
            {step === "receipt" && "Scan Receipt"}
          </DialogTitle>
          <DialogDescription>
            {step === "select" && "Choose how you'd like to add your food"}
            {step === "manual" && "Fill in the details for your food item"}
            {step === "barcode" && "Point your camera at the barcode"}
            {step === "receipt" && "Upload a receipt to automatically add items"}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-3 mt-4">
            <Button
              className="w-full justify-start"
              variant="outline"
              size="lg"
              onClick={() => setStep("manual")}
            >
              <PackageIcon className="h-5 w-5 mr-3" />
              Manual Entry
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              size="lg"
              onClick={() => setStep("barcode")}
            >
              <ScanBarcode className="h-5 w-5 mr-3" />
              Scan Barcode
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              size="lg"
              disabled
            >
              <Receipt className="h-5 w-5 mr-3" />
              Scan Receipt (Coming Soon)
            </Button>
          </div>
        )}

        {step === "manual" && (
          <ManualFoodForm
            onSubmit={handleSubmit}
            onCancel={() => {
              setBarcodeData(null);
              setStep("select");
            }}
            isSubmitting={isSubmitting}
            defaultValues={barcodeData || undefined}
          />
        )}

        {step === "barcode" && (
          <BarcodeScanner
            onScan={handleBarcodeScanned}
            onCancel={() => setStep("select")}
          />
        )}

        {step === "receipt" && (
          <div className="py-8 text-center text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Receipt scanning is coming soon!</p>
            <Button variant="outline" className="mt-4" onClick={() => setStep("select")}>
              Go Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
