ALTER TABLE public.food_items 
ADD COLUMN IF NOT EXISTS ai_assessment JSONB;
