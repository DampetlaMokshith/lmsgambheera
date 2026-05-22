create table public.user_quiz_progress (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  quiz_id text not null,
  course_id text not null,
  total_attempts integer not null default 0,
  best_score integer not null default 0,
  best_percentage integer not null default 0,
  completed boolean null default false,
  passed boolean null default false,
  first_attempted_at timestamp with time zone null default now(),
  last_attempted_at timestamp with time zone null default now(),
  constraint user_quiz_progress_pkey primary key (id),
  constraint user_quiz_progress_unique unique (user_id, quiz_id, course_id),
  constraint user_quiz_progress_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quiz_progress_user_id on public.user_quiz_progress using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_quiz_progress_quiz_id on public.user_quiz_progress using btree (quiz_id) TABLESPACE pg_default;

create index IF not exists idx_quiz_progress_course_id on public.user_quiz_progress using btree (course_id) TABLESPACE pg_default;