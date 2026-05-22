create table public.user_lecture_notes (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  course_id text not null,
  lecture_id text not null,
  notes text not null,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint user_lecture_notes_pkey primary key (id),
  constraint user_lecture_notes_user_id_lecture_id_key unique (user_id, lecture_id),
  constraint user_lecture_notes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_lecture_notes_user_id on public.user_lecture_notes using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_lecture_notes_lecture_id on public.user_lecture_notes using btree (lecture_id) TABLESPACE pg_default;

create index IF not exists idx_user_lecture_notes_course_id on public.user_lecture_notes using btree (course_id) TABLESPACE pg_default;

create index IF not exists idx_user_lecture_notes_updated_at on public.user_lecture_notes using btree (updated_at desc) TABLESPACE pg_default;

create index IF not exists idx_user_lecture_notes_user_lecture on public.user_lecture_notes using btree (user_id, lecture_id) TABLESPACE pg_default;

create trigger set_user_lecture_notes_updated_at BEFORE
update on user_lecture_notes for EACH row
execute FUNCTION update_user_lecture_notes_updated_at ();