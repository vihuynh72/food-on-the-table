import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

interface ExpiringItemsBannerProps {
  expiringSoonCount: number;
  expiredCount: number;
  onFilterExpiring: () => void;
}

export function ExpiringItemsBanner({
  expiringSoonCount,
  expiredCount,
  onFilterExpiring,
}: ExpiringItemsBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || (expiringSoonCount === 0 && expiredCount === 0)) {
    return null;
  }

  const hasExpired = expiredCount > 0;
  const hasExpiringSoon = expiringSoonCount > 0;

  let message = "";
  if (hasExpired && hasExpiringSoon) {
    message = `${expiredCount} item${expiredCount > 1 ? "s" : ""} expired, ${expiringSoonCount} expiring soon!`;
  } else if (hasExpired) {
    message = `${expiredCount} item${expiredCount > 1 ? "s have" : " has"} expired!`;
  } else {
    message = `${expiringSoonCount} item${expiringSoonCount > 1 ? "s are" : " is"} expiring soon!`;
  }

  return (
    <Alert
      variant={hasExpired ? "destructive" : "default"}
      className={`relative ${!hasExpired ? "border-secondary bg-secondary/10" : ""}`}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto"
            onClick={onFilterExpiring}
          >
            View items
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
