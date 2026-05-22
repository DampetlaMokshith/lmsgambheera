create table public.user_quiz_attempts (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  quiz_id text not null,
  course_id text not null,
  course_name text null,
  total_questions integer not null,
  time_limit_minutes integer null,
  allows_retakes boolean null default false,
  passing_score_percentage integer null default 60,
  questions_answered integer not null default 0,
  questions_correct integer not null default 0,
  score integer not null default 0,
  percentage integer not null default 0,
  passed boolean not null default false,
  time_taken integer not null default 0,
  time_remaining integer null default 0,
  answers jsonb null,
  attempted_at timestamp with time zone null default now(),
  submitted_at timestamp with time zone null default now(),
  constraint user_quiz_attempts_user_quiz_idx primary key (id),
  constraint user_quiz_attempts_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quiz_attempts_user_id on public.user_quiz_attempts using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_quiz_attempts_quiz_id on public.user_quiz_attempts using btree (quiz_id) TABLESPACE pg_default;

create index IF not exists idx_quiz_attempts_course_id on public.user_quiz_attempts using btree (course_id) TABLESPACE pg_default;

create index IF not exists idx_quiz_attempts_user_quiz on public.user_quiz_attempts using btree (user_id, quiz_id) TABLESPACE pg_default;

create index IF not exists idx_quiz_attempts_attempted_at on public.user_quiz_attempts using btree (attempted_at desc) TABLESPACE pg_default;

create trigger trigger_update_quiz_progress
after INSERT on user_quiz_attempts for EACH row
execute FUNCTION update_quiz_progress_after_attempt ();