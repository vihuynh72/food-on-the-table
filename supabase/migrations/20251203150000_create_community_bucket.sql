-- Create storage bucket for community post images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community_images',
  'community_images',
  true,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Policy to allow public access to view images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'community_images' );

-- Policy to allow authenticated users to upload images
create policy "Authenticated users can upload images"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'community_images' AND auth.uid() = owner );

-- Policy to allow users to update their own images
create policy "Users can update their own images"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'community_images' AND auth.uid() = owner );

-- Policy to allow users to delete their own images
create policy "Users can delete their own images"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'community_images' AND auth.uid() = owner );
