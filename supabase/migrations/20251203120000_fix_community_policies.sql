-- Add missing policies for community_posts
CREATE POLICY "Users can update their own posts" 
ON community_posts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON community_posts FOR DELETE 
USING (auth.uid() = user_id);
