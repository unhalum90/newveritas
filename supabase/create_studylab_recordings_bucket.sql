-- Create a new private bucket for StudyLab recordings
insert into storage.buckets (id, name, public)
values ('studylab-recordings', 'studylab-recordings', false)
on conflict (id) do nothing;

-- Policy: Students can upload their own recordings
create policy "Students can upload studylab recordings"
on storage.objects for insert
with check (
  bucket_id = 'studylab-recordings' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Students can view/download their own recordings (e.g. for playback)
create policy "Students can view owm studylab recordings"
on storage.objects for select
using (
  bucket_id = 'studylab-recordings' and
  auth.role() = 'authenticated' and
  (storage.foldername(name))[1] = auth.uid()::text
);
