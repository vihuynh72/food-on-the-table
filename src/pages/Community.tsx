import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { CommunityFilters } from "@/components/community/CommunityFilters";
import { CreatePostModal } from "@/components/community/CreatePostModal";
import { PostDetailDrawer } from "@/components/community/PostDetailDrawer";
import { ActivePostMap } from "@/components/community/ActivePostMap";
import { CommunityPostWithUser } from "@/types/community";
import { useUserLocation } from "@/hooks/useUserLocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CommunityCarousel } from "@/components/community/CommunityCarousel";

import { useQueryClient } from "@tanstack/react-query";

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { position } = useUserLocation();
  
  // State
  const [activeTab, setActiveTab] = useState("nearby");
  const [searchQuery, setSearchQuery] = useState("");
  
  // When "requests" tab is active, force type to 'request'
  const getEffectiveType = () => {
    if (activeTab === 'requests') return 'request';
    return selectedType;
  };
  const [selectedType, setSelectedType] = useState<'offer' | 'request' | 'all'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'cooked_meal', 'produce', 'pantry', 'baked', 'baby', 'other'
  ]);
  const [distance, setDistance] = useState(5);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<CommunityPostWithUser | null>(null);
  const [selectedPost, setSelectedPost] = useState<CommunityPostWithUser | null>(null);
  const [activeCarouselPost, setActiveCarouselPost] = useState<CommunityPostWithUser | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  // Data Fetching
  const { 
    data: posts = [], 
    isLoading, 
    error,
  } = useCommunityPosts({
    type: getEffectiveType(),
    category: selectedCategories,
    search: searchQuery,
    sortBy: activeTab === 'nearby' ? 'nearest' : 'newest',
    userLocation: position || undefined,
    userId: activeTab === 'my_posts' ? user?.id : undefined,
    savedByUserId: activeTab === 'saved' ? user?.id : undefined,
    distance: activeTab === 'nearby' ? distance : undefined,
  });

  // Initialize active post
  useEffect(() => {
    if (posts.length > 0 && !activeCarouselPost) {
      setActiveCarouselPost(posts[0]);
    }
  }, [posts]);

  // Debug logging
  console.log('Community Debug:', { activeTab, selectedType, effectiveType: getEffectiveType(), selectedCategories, postsCount: posts.length, error });

  // Handlers
  const handleInterest = (post: CommunityPostWithUser) => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be signed in to express interest.", variant: "destructive" });
      return;
    }
    setSelectedPost(post);
    setDetailDrawerOpen(true);
  };

  const handleLike = async (post: CommunityPostWithUser) => {
    if (!user) return;
    // Optimistic update or just fire and forget for now
    const { error } = await supabase.from('community_likes').insert({ post_id: post.id, user_id: user.id });
    if (!error) toast({ title: "Liked!" });
  };

  const handleSave = async (post: CommunityPostWithUser) => {
    if (!user) return;
    const { error } = await supabase.from('community_saves').insert({ post_id: post.id, user_id: user.id });
    if (!error) toast({ title: "Saved!" });
  };

  const handleReport = (post: CommunityPostWithUser) => {
    // Placeholder for report flow
    toast({ title: "Reported", description: "Thank you for keeping the community safe." });
  };

  const handleDelete = async (post: CommunityPostWithUser) => {
    if (!user) return;
    if (post.user_id !== user.id) {
      toast({ title: "Unauthorized", description: "You can only delete your own posts.", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from('community_posts').delete().eq('id', post.id);
    
    if (error) {
      toast({ title: "Error deleting post", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post deleted" });
      queryClient.invalidateQueries({ queryKey: ['community_posts'] });
    }
  };

  const handleEdit = (post: CommunityPostWithUser) => {
    if (!user) return;
    if (post.user_id !== user.id) {
      toast({ title: "Unauthorized", description: "You can only edit your own posts.", variant: "destructive" });
      return;
    }
    setPostToEdit(post);
    setCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Community</h1>
            <p className="text-muted-foreground">Share and discover food locally.</p>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search posts..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => setCreateModalOpen(true)} className="shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              Share Food
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="nearby">Nearby</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="my_posts" disabled={!user}>My Posts</TabsTrigger>
              <TabsTrigger value="saved" disabled={!user}>Saved</TabsTrigger>
            </TabsList>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_300px] gap-6 items-start h-[calc(100vh-220px)]">
            {/* Left: Filters */}
            <CommunityFilters
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              selectedCategories={selectedCategories}
              onCategoryChange={setSelectedCategories}
              distance={distance}
              onDistanceChange={setDistance}
            />

            {/* Center: Carousel Feed */}
            <div className="h-full w-full overflow-hidden rounded-xl bg-muted/10 border">
              <CommunityCarousel 
                posts={posts} 
                onInterest={handleInterest} 
                onSlideChange={setActiveCarouselPost}
              />
            </div>

            {/* Right: Active Post Map */}
            <div className="hidden lg:block h-full w-full overflow-hidden rounded-xl border bg-muted/10">
              <ActivePostMap post={activeCarouselPost} />
            </div>
          </div>
        </Tabs>
      </main>

      <CreatePostModal 
        open={createModalOpen} 
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) setPostToEdit(null);
        }}
        postToEdit={postToEdit}
      />

      <PostDetailDrawer 
        post={selectedPost} 
        open={detailDrawerOpen} 
        onOpenChange={setDetailDrawerOpen} 
        onEdit={(post) => {
          setDetailDrawerOpen(false);
          handleEdit(post);
        }}
        onDelete={(post) => {
          setDetailDrawerOpen(false);
          handleDelete(post);
        }}
      />
    </div>
  );
}
