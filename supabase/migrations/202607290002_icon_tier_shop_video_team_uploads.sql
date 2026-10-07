-- Add Icon athlete tier flag and externally linked shop tutorial videos.
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS is_icon boolean DEFAULT false;
ALTER TABLE public.shop_items ADD COLUMN IF NOT EXISTS tutorial_video_url text;

-- Storage note: create a public `team-members` bucket in Supabase Storage for direct
-- team member photo uploads. The app also accepts existing photo_url values.
