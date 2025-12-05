import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Use any to work around missing types until they're regenerated
const db = supabase as any;

interface InterestWithDetails {
  id: string;
  post_id: string;
  seeker_id: string;
  message: string | null;
  status: string;
  created_at: string;
  // User profile info
  user_profile: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface PostWithInterests {
  id: string;
  title: string;
  status: string;
  interests: InterestWithDetails[];
}

interface SentInterest {
  id: string;
  post_id: string;
  message: string | null;
  status: string;
  created_at: string;
  post: {
    id: string;
    title: string;
    status: string;
    user_id: string;
    giver_profile: {
      display_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

export function useInterestManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch interests for posts user owns (as giver)
  const { 
    data: receivedInterests = [], 
    isLoading: receivedLoading 
  } = useQuery({
    queryKey: ["received_interests", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all user's posts with pending interests
      const { data: posts, error: postsError } = await db
        .from("community_posts")
        .select(`
          id,
          title,
          status
        `)
        .eq("user_id", user.id)
        .in("status", ["active", "reserved"]);

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        return [];
      }

      if (!posts || posts.length === 0) return [];

      // Get interests for these posts
      const { data: interests, error: interestsError } = await db
        .from("community_interests")
        .select(`
          id,
          post_id,
          seeker_id,
          message,
          status,
          created_at
        `)
        .in("post_id", posts.map((p: any) => p.id))
        .order("created_at", { ascending: false });

      if (interestsError) {
        console.error("Error fetching interests:", interestsError);
        return [];
      }

      // Get user profiles for interests (seeker profiles)
      const seekerIds = [...new Set((interests || []).map((i: any) => i.seeker_id))];
      const { data: profiles } = await db
        .from("profiles")
        .select("user_id, username, first_name, avatar_url")
        .in("user_id", seekerIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, {
        display_name: p.username || p.first_name || null,
        avatar_url: p.avatar_url
      }]));

      // Map interests to posts
      const postsWithInterests: PostWithInterests[] = posts.map((post: any) => ({
        ...post,
        interests: (interests || [])
          .filter((i: any) => i.post_id === post.id)
          .map((i: any) => ({
            ...i,
            user_profile: profileMap.get(i.seeker_id) || null,
          })) as InterestWithDetails[],
      }));

      return postsWithInterests;
    },
    enabled: !!user,
  });

  // Fetch interests user has sent (as seeker)
  const { 
    data: sentInterests = [], 
    isLoading: sentLoading 
  } = useQuery({
    queryKey: ["sent_interests", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: interests, error: interestsError } = await db
        .from("community_interests")
        .select(`
          id,
          post_id,
          message,
          status,
          created_at
        `)
        .eq("seeker_id", user.id)
        .order("created_at", { ascending: false });

      if (interestsError) {
        console.error("Error fetching sent interests:", interestsError);
        return [];
      }

      if (!interests || interests.length === 0) return [];

      // Get post details
      const postIds = [...new Set(interests.map((i: any) => i.post_id))];
      const { data: posts } = await db
        .from("community_posts")
        .select("id, title, status, user_id")
        .in("id", postIds);

      // Get giver profiles
      const giverIds = [...new Set((posts || []).map((p: any) => p.user_id))];
      const { data: profiles } = await db
        .from("profiles")
        .select("user_id, username, first_name, avatar_url")
        .in("user_id", giverIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, {
        display_name: p.username || p.first_name || null,
        avatar_url: p.avatar_url
      }]));
      const postMap = new Map((posts || []).map((p: any) => [p.id, {
        ...p,
        giver_profile: profileMap.get(p.user_id) || null,
      }]));

      return interests.map((i: any) => ({
        ...i,
        post: postMap.get(i.post_id) || null,
      })) as SentInterest[];
    },
    enabled: !!user,
  });

  // Accept interest mutation
  const acceptInterest = useMutation({
    mutationFn: async ({ interestId, message }: { interestId: string; message?: string }) => {
      const { data, error } = await db.rpc("accept_interest", {
        p_interest_id: interestId,
        p_message: message || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Interest accepted!",
        description: "The person will be notified. You can coordinate pickup now.",
      });
      queryClient.invalidateQueries({ queryKey: ["received_interests"] });
      queryClient.invalidateQueries({ queryKey: ["community_posts"] });
    },
    onError: (error) => {
      console.error("Error accepting interest:", error);
      toast({
        title: "Error",
        description: "Failed to accept interest. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Decline interest mutation
  const declineInterest = useMutation({
    mutationFn: async ({ interestId, message }: { interestId: string; message?: string }) => {
      const { data, error } = await db.rpc("decline_interest", {
        p_interest_id: interestId,
        p_message: message || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Interest declined",
        description: "The person has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["received_interests"] });
    },
    onError: (error) => {
      console.error("Error declining interest:", error);
      toast({
        title: "Error",
        description: "Failed to decline interest. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ interestId, message }: { interestId: string; message: string }) => {
      const { data, error } = await db.rpc("send_interest_message", {
        p_interest_id: interestId,
        p_message: message,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: "The other person will be notified.",
      });
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Get pending interests count (for badge)
  const pendingCount = receivedInterests.reduce(
    (count, post) => count + post.interests.filter(i => i.status === "pending").length,
    0
  );

  return {
    receivedInterests,
    sentInterests,
    receivedLoading,
    sentLoading,
    acceptInterest,
    declineInterest,
    sendMessage,
    pendingCount,
  };
}
