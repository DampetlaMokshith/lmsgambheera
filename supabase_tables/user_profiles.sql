create table public.user_profiles (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  full_name text null,
  gender text null,
  guardian_email text null,
  date_of_birth date null,
  registration_number text null,
  college text null,
  batch text null,
  degree text null,
  department text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_profiles_pkey primary key (id),
  constraint user_profiles_user_id_key unique (user_id),
  constraint user_profiles_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_profiles_gender_check check (
    (
      gender = any (array['male'::text, 'female'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists user_profiles_user_id_idx on public.user_profiles using btree (user_id) TABLESPACE pg_default;

create trigger update_user_profiles_updated_at BEFORE
update on user_profiles for EACH row
execute FUNCTION update_updated_at_column ();