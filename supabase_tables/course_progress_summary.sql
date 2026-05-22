create table public.course_progress_summary (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  course_id text not null,
  lectures_completed integer null default 0,
  modules_completed integer null default 0,
  assignments_completed integer null default 0,
  quizzes_completed integer null default 0,
  total_completed integer null default 0,
  progress_percentage integer null default 0,
  last_activity timestamp with time zone null default now(),
  started_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint course_progress_summary_pkey primary key (id),
  constraint course_progress_summary_user_id_course_id_key unique (user_id, course_id),
  constraint course_progress_summary_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint course_progress_summary_progress_percentage_check check (
    (
      (progress_percentage >= 0)
      and (progress_percentage <= 100)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_summary_user_course on public.course_progress_summary using btree (user_id, course_id) TABLESPACE pg_default;

create index IF not exists idx_summary_user on public.course_progress_summary using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_summary_progress on public.course_progress_summary using btree (progress_percentage) TABLESPACE pg_default;

create index IF not exists idx_summary_last_activity on public.course_progress_summary using btree (last_activity) TABLESPACE pg_default;