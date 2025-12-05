import { Database } from "@/integrations/supabase/types";

type CommunityPost = Database["public"]["Tables"]["community_posts"]["Row"];
type CommunityPostPhoto = Database["public"]["Tables"]["community_post_photos"]["Row"];

export type CommunityPostWithUser = CommunityPost & {
  profiles: {
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  community_post_photos: CommunityPostPhoto[];
};
