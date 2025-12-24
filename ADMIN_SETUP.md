# Admin Consoles (MVP) — Setup + Usage

This repo includes two admin experiences:

- **School Admin Console** (institution IT/EdTech) at `/schools/admin`
- **Platform Admin Console** (super admin) at `/admin`

## Roles

Roles are stored in Supabase Auth user metadata:

- `teacher`
- `student`
- `school_admin`
- `platform_admin`

## School Admin (institution setup)

1. Visit `/schools/register`
2. Create a `school_admin` account (or use `/schools/register?resume=1` if you already created the user).
3. The bootstrap step creates:
   - `public.schools` row
   - `public.workspaces` row named “Main Workspace”
   - `public.school_admins` row linking your user to the school

After bootstrap, you’ll land in `/schools/admin`.

### Manage teachers

- `/schools/admin/teachers` — create, list, enable/disable
- `/schools/admin/teachers/bulk-upload` — paste CSV to create multiple teachers

Created teachers are stored as:

- Supabase Auth users (`email` + temporary password)
- `public.teachers` row with `teachers.disabled` support

## Platform Admin (super admin allowlist)

Platform admin access is **allowlisted** in the database.

1. Make sure the Auth user has metadata role `platform_admin`.
2. Insert your user id into `public.platform_admins`:

```sql
insert into public.platform_admins (user_id) values ('YOUR_AUTH_USER_ID');
```

Then visit `/admin`.

## Notes

- The admin API routes use the Supabase **service role** to perform admin operations (create users, update teacher status) so you don’t have to fight RLS for admin tasks.
- Don’t commit `.env*` files with secrets.
