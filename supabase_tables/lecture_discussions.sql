create table public.lecture_discussions (
  id uuid not null default gen_random_uuid (),
  course_id text not null,
  lecture_id text not null,
  user_id uuid not null,
  message text not null,
  parent_id uuid null,
  is_edited boolean null default false,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint lecture_discussions_pkey primary key (id),
  constraint lecture_discussions_parent_id_fkey foreign KEY (parent_id) references lecture_discussions (id) on delete CASCADE,
  constraint lecture_discussions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_lecture_discussions_course_id on public.lecture_discussions using btree (course_id) TABLESPACE pg_default;

create index IF not exists idx_lecture_discussions_lecture_id on public.lecture_discussions using btree (lecture_id) TABLESPACE pg_default;

create index IF not exists idx_lecture_discussions_user_id on public.lecture_discussions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_lecture_discussions_parent_id on public.lecture_discussions using btree (parent_id) TABLESPACE pg_default;

create index IF not exists idx_lecture_discussions_created_at on public.lecture_discussions using btree (created_at) TABLESPACE pg_default;

create trigger update_lecture_discussions_updated_at BEFORE
update on lecture_discussions for EACH row
execute FUNCTION update_updated_at_column ();