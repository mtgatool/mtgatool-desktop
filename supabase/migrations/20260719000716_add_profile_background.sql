alter table public.profiles add column if not exists background jsonb;
comment on column public.profiles.background is 'Optional custom app background descriptor (artofmtg): {source,imageUrl,page,title,artist,set}. No data URI — the client re-materializes the image via the random-art edge function.';
