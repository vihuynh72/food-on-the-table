  -- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view their own likes" ON public.learn_user_likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.learn_user_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.learn_user_likes;

DROP POLICY IF EXISTS "Users can view their own saves" ON public.learn_user_saves;
DROP POLICY IF EXISTS "Users can insert their own saves" ON public.learn_user_saves;
DROP POLICY IF EXISTS "Users can delete their own saves" ON public.learn_user_saves;

-- Create tables
CREATE TABLE IF NOT EXISTS public.learn_user_likes (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    lesson_id uuid not null references public.learn_lessons(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id),
    unique(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.learn_user_saves (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    lesson_id uuid not null references public.learn_lessons(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id),
    unique(user_id, lesson_id)
);

-- RLS for likes
ALTER TABLE public.learn_user_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own likes"
    ON public.learn_user_likes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own likes"
    ON public.learn_user_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
    ON public.learn_user_likes FOR DELETE
    USING (auth.uid() = user_id);

-- RLS for saves
ALTER TABLE public.learn_user_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saves"
    ON public.learn_user_saves FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saves"
    ON public.learn_user_saves FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves"
    ON public.learn_user_saves FOR DELETE
    USING (auth.uid() = user_id);
