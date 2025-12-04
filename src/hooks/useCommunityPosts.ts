import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CommunityPostWithUser } from "@/types/community";

interface UseCommunityPostsOptions {
  type?: 'offer' | 'request' | 'all';
  category?: string[];
  search?: string;
  sortBy?: 'newest' | 'ending_soon' | 'nearest';
  userLocation?: { lat: number; lng: number };
  userId?: string; // For "My Posts"
  savedByUserId?: string; // For "Saved"
  distance?: number; // Distance in miles
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3959; // Radius of the earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in miles
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function useCommunityPosts({ type, category, search, sortBy, userLocation, userId, savedByUserId, distance }: UseCommunityPostsOptions = {}) {
  return useQuery({
    queryKey: ['community_posts', type, category, search, sortBy, userLocation, userId, savedByUserId, distance],
    queryFn: async () => {
      // First, fetch posts
      let query = supabase
        .from('community_posts')
        .select(`
          *,
          community_post_photos (*)
        `);

      // If fetching my posts, don't filter by status 'active' necessarily, or maybe I want to see all my posts
      if (userId) {
        query = query.eq('user_id', userId);
      } else if (savedByUserId) {
        // Fetch saved post IDs first.
        const { data: savedData } = await supabase
          .from('community_saves')
          .select('post_id')
          .eq('user_id', savedByUserId);
          
        const savedPostIds = savedData?.map(s => s.post_id) || [];
        
        if (savedPostIds.length === 0) return [];
        
        query = query.in('id', savedPostIds);
      } else {
        // Default feed: only active posts
        query = query.eq('status', 'active');
      }

      if (type && type !== 'all') {
        query = query.eq('type', type);
      }

      // Only filter by category if some (but not all) are selected
      // If all 6 categories are selected, don't filter (show everything including null categories)
      const ALL_CATEGORIES = ['cooked_meal', 'produce', 'pantry', 'baked', 'baby', 'other'];
      const hasAllCategories = category && category.length >= ALL_CATEGORIES.length;
      
      if (category && category.length > 0 && !hasAllCategories) {
        // Filter by selected categories (including null for uncategorized posts)
        // Note: .in() with nulls is tricky in Supabase/PostgREST. 
        // We'll stick to simple IN for now, assuming most posts have categories or user selects "Other"
        query = query.in('category', category);
      }

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      // Sorting
      if (sortBy === 'ending_soon') {
        query = query.order('best_before_at', { ascending: true });
      } else if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else {
        // Default to newest
        query = query.order('created_at', { ascending: false });
      }

      // Limit to 50 posts for the carousel to keep it performant
      query = query.limit(50);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching community posts:', error);
        throw error;
      }

      // Now fetch profiles for all user_ids in the posts
      const userIds = [...new Set(data?.map(p => p.user_id).filter(Boolean) || [])];
      
      let profilesMap: Record<string, { username: string | null; first_name: string | null; last_name: string | null; avatar_url: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, username, first_name, last_name, avatar_url')
          .in('user_id', userIds) as { data: Array<{ user_id: string; username: string | null; first_name: string | null; last_name: string | null; avatar_url: string | null }> | null };
        
        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap[profile.user_id] = {
              username: profile.username,
              first_name: profile.first_name,
              last_name: profile.last_name,
              avatar_url: profile.avatar_url
            };
          });
        }
      }

      // Merge profiles into posts
      let posts: CommunityPostWithUser[] = (data || []).map(post => ({
        ...post,
        profiles: post.user_id ? profilesMap[post.user_id] || null : null,
        community_post_photos: post.community_post_photos || []
      })) as CommunityPostWithUser[];

      if (userLocation) {
        // Calculate distance and filter
        if (distance !== undefined) {
          posts = posts.filter(post => {
            if (!post.location_lat || !post.location_lng) return false;
            const dist = calculateDistance(userLocation.lat, userLocation.lng, post.location_lat, post.location_lng);
            return dist <= distance;
          });
        }

        if (sortBy === 'nearest') {
          posts.sort((a, b) => {
            if (!a.location_lat || !a.location_lng) return 1;
            if (!b.location_lat || !b.location_lng) return -1;
            
            const distA = calculateDistance(userLocation.lat, userLocation.lng, a.location_lat, a.location_lng);
            const distB = calculateDistance(userLocation.lat, userLocation.lng, b.location_lat, b.location_lng);
            
            return distA - distB;
          });
        }
      }

      return posts;
    }
  });
}


