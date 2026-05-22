create table public.courses (
  id uuid not null default gen_random_uuid (),
  sanity_id text not null,
  title text not null,
  slug text not null,
  description text null,
  thumbnail_url text null,
  faculty_name text not null,
  faculty_email text null,
  rating numeric(2, 1) null default 4.5,
  total_enrollments integer null default 0,
  estimated_duration integer null,
  level text null,
  price numeric(10, 2) null default 0,
  tags text[] null,
  degree text null,
  department text null,
  language text null default 'English'::text,
  is_published boolean null default false,
  is_featured boolean null default false,
  published_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint courses_pkey primary key (id),
  constraint courses_sanity_id_key unique (sanity_id),
  constraint courses_slug_key unique (slug),
  constraint courses_level_check check (
    (
      level = any (
        array[
          'beginner'::text,
          'intermediate'::text,
          'advanced'::text
        ]
      )
    )
  ),
  constraint courses_rating_check check (
    (
      (rating >= (1)::numeric)
      and (rating <= (5)::numeric)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_courses_sanity_id on public.courses using btree (sanity_id) TABLESPACE pg_default;

create index IF not exists idx_courses_slug on public.courses using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_courses_published on public.courses using btree (is_published) TABLESPACE pg_default;

create index IF not exists idx_courses_featured on public.courses using btree (is_featured) TABLESPACE pg_default;

create index IF not exists idx_courses_faculty_email on public.courses using btree (faculty_email) TABLESPACE pg_default;

create trigger trigger_courses_updated_at BEFORE
update on courses for EACH row
execute FUNCTION update_updated_at_column ();