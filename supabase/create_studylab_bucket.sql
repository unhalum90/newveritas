-- Create a new private bucket for StudyLab images
insert into storage.buckets (id, name, public)
values ('studylab-images', 'studylab-images', false)
on conflict (id) do nothing;

-- Policy: Students can upload their own images
create policy "Students can upload studylab images"
on storage.objects for insert
with check (
  bucket_id = 'studylab-images' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Students can view their own images
create policy "Students can view owm studylab images"
on storage.objects for select
using (
  bucket_id = 'studylab-images' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
);
