import { CommunityPostWithUser } from "@/types/community";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow, format } from "date-fns";
import { MapPin, Clock, Heart, Bookmark, MoreHorizontal, MessageCircle, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

interface CommunityPostCardProps {
  post: CommunityPostWithUser;
  onInterest: (post: CommunityPostWithUser) => void;
  onLike: (post: CommunityPostWithUser) => void;
  onSave: (post: CommunityPostWithUser) => void;
  onReport: (post: CommunityPostWithUser) => void;
  onDelete?: (post: CommunityPostWithUser) => void;
  onEdit?: (post: CommunityPostWithUser) => void;
}

import { getPostImage } from "@/lib/utils";

// ...existing code...

export function CommunityPostCard({ post, onInterest, onLike, onSave, onReport, onDelete, onEdit }: CommunityPostCardProps) {
  const { user } = useAuth();
  const isOwner = user?.id === post.user_id;

  const isExpired = post.status === 'expired' || (post.best_before_at && new Date(post.best_before_at) < new Date());
  const isReserved = post.status === 'reserved';
  const isPickedUp = post.status === 'picked_up';

  const getStatusBadge = () => {
    if (isPickedUp) return <Badge variant="secondary">Picked Up</Badge>;
    if (isReserved) return <Badge variant="secondary">Reserved</Badge>;
    if (isExpired) return <Badge variant="destructive">Expired</Badge>;
    return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>;
  };

  const posterName = post.profiles?.first_name 
    ? `${post.profiles.first_name} ${post.profiles.last_name?.charAt(0) || ''}.`
    : "Anonymous";
  
  const posterInitials = post.profiles?.first_name 
    ? `${post.profiles.first_name.charAt(0)}${post.profiles.last_name?.charAt(0) || ''}`
    : "?";

  const displayImage = getPostImage(post.category, post.community_post_photos?.[0]?.url);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
      <div className="relative aspect-video bg-muted">
        <img 
          src={displayImage} 
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          {getStatusBadge()}
        </div>
        <div className="absolute top-2 left-2">
          <Badge variant={post.type === 'offer' ? "default" : "secondary"} className={post.type === 'offer' ? "bg-primary" : "bg-orange-500"}>
            {post.type === 'offer' ? 'Offer' : 'Request'}
          </Badge>
        </div>
      </div>

      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg leading-tight line-clamp-1">{post.title}</h3>
            <div className="flex items-center text-sm text-muted-foreground mt-1 gap-2">
              {post.location_label && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {post.location_label}
                </span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDistanceToNow(new Date(post.created_at || new Date()), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {post.category && <Badge variant="outline" className="text-xs">{post.category}</Badge>}
          {post.tags?.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs bg-muted/50">{tag}</Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {post.description}
        </p>
        {post.best_before_at && (
          <div className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-md">
            <Clock className="w-3 h-3" />
            Best before: {format(new Date(post.best_before_at), "MMM d, h:mm a")}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-2 flex items-center justify-between border-t bg-muted/10">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={post.profiles?.avatar_url || undefined} />
            <AvatarFallback>{posterInitials}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{posterName}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onLike(post); }}>
            <Heart className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onSave(post); }}>
            <Bookmark className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwner && onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(post); }}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {isOwner && onDelete && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(post); }} className="text-destructive focus:text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReport(post); }}>Report Post</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {isOwner ? (
            <Button size="sm" variant="outline" className="ml-2" onClick={(e) => { e.stopPropagation(); onEdit?.(post); }}>
              Manage
            </Button>
          ) : (
            <Button size="sm" className="ml-2" onClick={(e) => { e.stopPropagation(); onInterest(post); }}>
              I'm Interested
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
