-- Ensure food_items table exists (idempotent check not strictly possible in standard SQL without DO block, but CREATE TABLE IF NOT EXISTS is safe)
CREATE TABLE IF NOT EXISTS public.food_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  quantity TEXT,
  storage TEXT CHECK (storage IN ('fridge', 'freezer', 'pantry')) DEFAULT 'fridge',
  category TEXT,
  purchase_date DATE,
  expiry_date DATE NOT NULL,
  barcode TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure we start fresh and avoid conflicts
DROP POLICY IF EXISTS "Users can view their food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can insert their food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can update their food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can delete their food items" ON public.food_items;

-- Re-create RLS Policies
CREATE POLICY "Users can view their food items" 
ON public.food_items 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their food items" 
ON public.food_items 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their food items" 
ON public.food_items 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their food items" 
ON public.food_items 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
