-- Create storage bucket for donation photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'donation-photos',
  'donation-photos',
  true,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp']
);

-- Create donations table
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  food_item_name text not null,
  quantity text,
  location_id text not null,
  location_name text not null,
  photo_url text,
  points_earned integer default 10,
  impact_kg decimal default 1.0,
  impact_co2 decimal default 2.5,
  impact_money decimal default 5.0,
  donated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.donations enable row level security;

-- RLS policies for donations
create policy "Users can view their own donations"
  on public.donations for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own donations"
  on public.donations for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Create user_stats table for tracking cumulative impact
create table public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_points integer default 0,
  total_food_saved_kg decimal default 0,
  total_co2_reduced_kg decimal default 0,
  total_money_saved decimal default 0,
  total_donations integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.user_stats enable row level security;

-- RLS policies for user_stats
create policy "Users can view their own stats"
  on public.user_stats for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own stats"
  on public.user_stats for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own stats"
  on public.user_stats for update
  to authenticated
  using (auth.uid() = user_id);

-- Function to update user stats after donation
create or replace function public.update_user_stats_on_donation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Insert or update user stats
  insert into public.user_stats (
    user_id,
    total_points,
    total_food_saved_kg,
    total_co2_reduced_kg,
    total_money_saved,
    total_donations
  )
  values (
    new.user_id,
    new.points_earned,
    new.impact_kg,
    new.impact_co2,
    new.impact_money,
    1
  )
  on conflict (user_id) do update set
    total_points = user_stats.total_points + new.points_earned,
    total_food_saved_kg = user_stats.total_food_saved_kg + new.impact_kg,
    total_co2_reduced_kg = user_stats.total_co2_reduced_kg + new.impact_co2,
    total_money_saved = user_stats.total_money_saved + new.impact_money,
    total_donations = user_stats.total_donations + 1,
    updated_at = now();
  
  return new;
end;
$$;

-- Trigger to update stats on new donation
create trigger on_donation_created
  after insert on public.donations
  for each row
  execute function public.update_user_stats_on_donation();

-- Storage policies for donation photos
create policy "Users can upload donation photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'donation-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Anyone can view donation photos"
  on storage.objects for select
  to public
  using (bucket_id = 'donation-photos');

create policy "Users can update their own donation photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'donation-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own donation photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'donation-photos' and
    auth.uid()::text = (storage.foldername(name))[1]
  );