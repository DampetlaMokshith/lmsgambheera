create table public.course_discussions (
  id uuid not null default gen_random_uuid (),
  course_id text not null,
  user_id uuid not null,
  message text not null,
  parent_id uuid null,
  is_edited boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint course_discussions_pkey primary key (id),
  constraint course_discussions_parent_id_fkey foreign KEY (parent_id) references course_discussions (id) on delete CASCADE,
  constraint course_discussions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_course_discussions_course_id on public.course_discussions using btree (course_id) TABLESPACE pg_default;

create index IF not exists idx_course_discussions_user_id on public.course_discussions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_course_discussions_parent_id on public.course_discussions using btree (parent_id) TABLESPACE pg_default;

create index IF not exists idx_course_discussions_created_at on public.course_discussions using btree (created_at desc) TABLESPACE pg_default;

create trigger update_course_discussions_updated_at BEFORE
update on course_discussions for EACH row
execute FUNCTION update_updated_at_column ();