-- Confirmed placeholder/test article must not appear in the public News feed before launch.
-- Keep it available to admins as Draft instead of deleting editorial history.
UPDATE public.news
SET published = false,
    pinned = false,
    updated_at = NOW()
WHERE title ILIKE '%Blaze%Legacy%'
   OR content ILIKE '%Ethan%Blaze%Carter%'
   OR content ILIKE '%Cyber Strike%'
   OR excerpt ILIKE '%Cyber Strike%';
