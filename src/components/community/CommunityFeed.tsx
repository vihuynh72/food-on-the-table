import { CommunityPostWithUser } from "@/types/community";
import { CommunityPostCard } from "./CommunityPostCard";
import { Loader2 } from "lucide-react";

interface CommunityFeedProps {
  posts: CommunityPostWithUser[];
  isLoading: boolean;
  onInterest: (post: CommunityPostWithUser) => void;
  onLike: (post: CommunityPostWithUser) => void;
  onSave: (post: CommunityPostWithUser) => void;
  onReport: (post: CommunityPostWithUser) => void;
  onDelete?: (post: CommunityPostWithUser) => void;
  onEdit?: (post: CommunityPostWithUser) => void;
}

export function CommunityFeed({ 
  posts, 
  isLoading, 
  onInterest, 
  onLike, 
  onSave, 
  onReport,
  onDelete,
  onEdit
}: CommunityFeedProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No posts found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      {posts.map((post) => (
        <CommunityPostCard
          key={post.id}
          post={post}
          onInterest={onInterest}
          onLike={onLike}
          onSave={onSave}
          onReport={onReport}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
