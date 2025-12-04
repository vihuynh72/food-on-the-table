import { CommunityPostWithUser } from "@/types/community";
import { Carousel, SlideData } from "@/components/ui/3d-carousel";
import { formatDistanceToNow, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface CommunityCarouselProps {
  posts: CommunityPostWithUser[];
  onInterest: (post: CommunityPostWithUser) => void;
  onSlideChange?: (post: CommunityPostWithUser) => void;
}

export function CommunityCarousel({ posts, onInterest, onSlideChange }: CommunityCarouselProps) {
  const { user } = useAuth();

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No posts found matching your criteria.</p>
      </div>
    );
  }

  const slides: SlideData[] = posts.map((post) => {
    const isMe = user?.id === post.user_id;
    
    let posterName = "Anonymous";
    let posterInitials = "?";

    if (isMe) {
      posterName = "You";
      posterInitials = "ME";
    } else if (post.profiles?.username) {
      posterName = post.profiles.username;
      posterInitials = post.profiles.username.charAt(0).toUpperCase();
    } else if (post.profiles?.first_name) {
      posterName = `${post.profiles.first_name} ${post.profiles.last_name?.charAt(0) || ''}.`;
      posterInitials = `${post.profiles.first_name.charAt(0)}${post.profiles.last_name?.charAt(0) || ''}`;
    }

    return {
      title: post.title,
      button: isMe ? "Manage Post" : "I'm Interested",
      // Only pass src if it's a real photo URL, otherwise undefined to trigger fallback
      src: post.community_post_photos?.[0]?.url || undefined,
      onClick: () => onInterest(post),
      // Rich data
      type: post.type as "offer" | "request",
      category: post.category || 'Other',
      distance: post.location_label || undefined,
      postedAt: formatDistanceToNow(new Date(post.created_at || new Date()), { addSuffix: true }),
      expiresAt: post.best_before_at ? format(new Date(post.best_before_at), "MMM d") : undefined,
      user: {
        name: posterName,
        avatar: post.profiles?.avatar_url || undefined,
        initials: posterInitials
      },
      description: post.description || undefined
    };
  });

  return (
    <div className="relative overflow-hidden w-full h-full py-10">
      <Carousel 
        slides={slides} 
        onSlideChange={(index) => {
          if (onSlideChange && posts[index]) {
            onSlideChange(posts[index]);
          }
        }}
      />
    </div>
  );
}
