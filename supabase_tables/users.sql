create table public.users (
  id uuid not null,
  email text null,
  full_name text null,
  role text null default 'student'::text,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  sanity_faculty_id text null,
  constraint users_pkey primary key (id)
) TABLESPACE pg_default;