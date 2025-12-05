import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, X, MessageSquare, Loader2, User, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InterestChatDrawer } from "./InterestChatDrawer";
import { cn } from "@/lib/utils";

interface Interest {
  id: string;
  post_id: string;
  seeker_id: string;
  message: string | null;
  status: string;
  created_at: string;
  user_profile: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface InterestManagementPanelProps {
  interests: Interest[];
  onAccept: (interestId: string, message?: string) => void;
  onDecline: (interestId: string, message?: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function InterestManagementPanel({
  interests,
  onAccept,
  onDecline,
  isLoading,
  className,
}: InterestManagementPanelProps) {
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null);
  const [actionType, setActionType] = useState<"accept" | "decline" | null>(null);
  const [responseMessage, setResponseMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInterest, setChatInterest] = useState<Interest | null>(null);

  const pendingInterests = interests.filter((i) => i.status === "pending");
  const acceptedInterests = interests.filter((i) => i.status === "accepted");
  const declinedInterests = interests.filter((i) => i.status === "declined");

  const handleAction = async () => {
    if (!selectedInterest || !actionType) return;

    setSubmitting(true);
    try {
      if (actionType === "accept") {
        await onAccept(selectedInterest.id, responseMessage || undefined);
      } else {
        await onDecline(selectedInterest.id, responseMessage || undefined);
      }
      setSelectedInterest(null);
      setActionType(null);
      setResponseMessage("");
    } finally {
      setSubmitting(false);
    }
  };

  const openActionDialog = (interest: Interest, type: "accept" | "decline") => {
    setSelectedInterest(interest);
    setActionType(type);
    setResponseMessage(
      type === "accept"
        ? "Great! I'll meet you at the pickup location. Let me know when works for you."
        : ""
    );
  };

  const openChatWithInterest = (interest: Interest) => {
    setChatInterest(interest);
    setChatOpen(true);
  };

  if (interests.length === 0) {
    return (
      <div className={cn("text-center py-6", className)}>
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No one has expressed interest yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Pending Interests */}
      {pendingInterests.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Pending ({pendingInterests.length})
          </h4>
          {pendingInterests.map((interest) => (
            <InterestCard
              key={interest.id}
              interest={interest}
              onAccept={() => openActionDialog(interest, "accept")}
              onDecline={() => openActionDialog(interest, "decline")}
              onMessage={() => openChatWithInterest(interest)}
            />
          ))}
        </div>
      )}

      {/* Accepted Interests */}
      {acceptedInterests.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Accepted ({acceptedInterests.length})
          </h4>
          {acceptedInterests.map((interest) => (
            <InterestCard
              key={interest.id}
              interest={interest}
              showStatus
              onMessage={() => openChatWithInterest(interest)}
            />
          ))}
        </div>
      )}

      {/* Declined Interests */}
      {declinedInterests.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Declined ({declinedInterests.length})
          </h4>
          {declinedInterests.map((interest) => (
            <InterestCard
              key={interest.id}
              interest={interest}
              showStatus
            />
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!selectedInterest} onOpenChange={(open) => !open && setSelectedInterest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "accept" ? "Accept Request" : "Decline Request"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "accept"
                ? `Accept ${selectedInterest?.user_profile?.display_name || "this person"}'s request? They'll be notified and you can coordinate pickup.`
                : `Are you sure you want to decline? You can include an optional message.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              placeholder={
                actionType === "accept"
                  ? "Add a message (optional)..."
                  : "Reason for declining (optional)..."
              }
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedInterest(null)}>
              Cancel
            </Button>
            <Button
              variant={actionType === "accept" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === "accept" ? "Accept" : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Drawer */}
      <InterestChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        interestId={chatInterest?.id || null}
        otherUserName={chatInterest?.user_profile?.display_name || "User"}
      />
    </div>
  );
}

interface InterestCardProps {
  interest: Interest;
  onAccept?: () => void;
  onDecline?: () => void;
  onMessage?: () => void;
  showStatus?: boolean;
}

function InterestCard({ interest, onAccept, onDecline, onMessage, showStatus }: InterestCardProps) {
  const displayName = interest.user_profile?.display_name || "Someone";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-3 bg-muted/30 rounded-lg space-y-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={interest.user_profile?.avatar_url || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{displayName}</p>
            {showStatus && (
              <Badge
                variant={interest.status === "accepted" ? "default" : "secondary"}
                className={cn(
                  "text-xs",
                  interest.status === "accepted" && "bg-green-100 text-green-700",
                  interest.status === "declined" && "bg-red-100 text-red-700"
                )}
              >
                {interest.status}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(interest.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {interest.message && (
        <div className="bg-background rounded-md p-2 text-sm text-muted-foreground">
          <MessageSquare className="h-3 w-3 inline-block mr-1 opacity-50" />
          "{interest.message}"
        </div>
      )}

      <div className="flex gap-2">
        {!showStatus && onAccept && (
          <Button size="sm" className="flex-1" onClick={onAccept}>
            <Check className="h-4 w-4 mr-1" />
            Accept
          </Button>
        )}
        {!showStatus && onDecline && (
          <Button size="sm" variant="outline" className="flex-1" onClick={onDecline}>
            <X className="h-4 w-4 mr-1" />
            Decline
          </Button>
        )}
        {onMessage && (
          <Button size="sm" variant="secondary" onClick={onMessage}>
            <Send className="h-4 w-4 mr-1" />
            Message
          </Button>
        )}
      </div>
    </div>
  );
}
