import { Tables } from "@/integrations/supabase/types";

export type CommunityPostWithUser = Tables<"community_posts"> & {
  profiles: {
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  community_post_photos: Tables<"community_post_photos">[];
};
