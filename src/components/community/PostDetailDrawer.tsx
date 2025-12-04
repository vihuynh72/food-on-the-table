import { useState } from "react";
import { CommunityPostWithUser } from "@/types/community";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { MapPin, Clock, Heart, Bookmark, Flag, Send, Loader2, Pencil, Trash2 } from "lucide-react";
import { formatCategory } from "@/lib/utils";

interface PostDetailDrawerProps {
  post: CommunityPostWithUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (post: CommunityPostWithUser) => void;
  onDelete?: (post: CommunityPostWithUser) => void;
}

export function PostDetailDrawer({ post, open, onOpenChange, onEdit, onDelete }: PostDetailDrawerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interestMessage, setInterestMessage] = useState("Hi! I'd love to pick this up.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInterestForm, setShowInterestForm] = useState(false);

  if (!post) return null;

  const posterName = post.profiles?.username
    ? post.profiles.username
    : post.profiles?.first_name 
      ? `${post.profiles.first_name} ${post.profiles.last_name?.charAt(0) || ''}.`
      : "Anonymous";
  
  const posterInitials = post.profiles?.username
    ? post.profiles.username.charAt(0).toUpperCase()
    : post.profiles?.first_name 
      ? `${post.profiles.first_name.charAt(0)}${post.profiles.last_name?.charAt(0) || ''}`
      : "?";

  const handleInterestSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be signed in to express interest.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('community_interests')
        .insert({
          post_id: post.id,
          giver_id: post.user_id,
          seeker_id: user.id,
          message: interestMessage,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Interest sent!",
        description: "The poster has been notified.",
      });
      setShowInterestForm(false);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send interest",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[96vh]">
        <div className="mx-auto w-full max-w-lg overflow-y-auto">
          <div className="relative aspect-video bg-muted w-full">
            {post.community_post_photos?.[0] ? (
              <img 
                src={post.community_post_photos[0].url} 
                alt={post.community_post_photos[0].alt || post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/50">
                No Photo
              </div>
            )}
            <Button 
              variant="secondary" 
              size="icon" 
              className="absolute top-4 right-4 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={() => onOpenChange(false)}
            >
              <span className="sr-only">Close</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            </Button>
          </div>

          <DrawerHeader className="text-left">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={post.type === 'offer' ? "default" : "secondary"}>
                {post.type === 'offer' ? 'Offer' : 'Request'}
              </Badge>
              {post.category && <Badge variant="outline">{formatCategory(post.category)}</Badge>}
            </div>
            <DrawerTitle className="text-2xl font-bold">{post.title}</DrawerTitle>
            <DrawerDescription className="flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4" />
              {post.location_label || "Nearby"}
              <span>•</span>
              <Clock className="w-4 h-4" />
              Posted {formatDistanceToNow(new Date(post.created_at || new Date()), { addSuffix: true })}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-6 pb-8">
            {/* Poster Info */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={post.profiles?.avatar_url || undefined} />
                  <AvatarFallback>{posterInitials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{posterName}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">View Profile</Button>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-semibold">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {post.description}
              </p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase">Quantity</span>
                <p className="font-medium">{post.remaining_portions} portions</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase">Best Before</span>
                <p className="font-medium">
                  {post.best_before_at ? format(new Date(post.best_before_at), "MMM d, yyyy") : "N/A"}
                </p>
              </div>
            </div>

            {/* Interest Form */}
            {user?.id === post.user_id ? (
              <Button className="w-full h-12 text-lg" variant="outline" onClick={() => onEdit?.(post)}>
                <Pencil className="w-4 h-4 mr-2" />
                Manage Post
              </Button>
            ) : showInterestForm ? (
              <div className="space-y-4">
                <Textarea
                  placeholder="Write a message to the poster..."
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleInterestSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Request
                  </Button>
                  <Button variant="outline" onClick={() => setShowInterestForm(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <Button className="w-full h-12 text-lg" onClick={() => setShowInterestForm(true)}>
                I'm Interested
              </Button>
            )}

            {/* Secondary Actions */}
            <div className="flex justify-center gap-4 pt-4">
              {user?.id === post.user_id ? (
                <>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={() => onEdit?.(post)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => onDelete?.(post)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Heart className="w-4 h-4 mr-2" />
                    Like
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
