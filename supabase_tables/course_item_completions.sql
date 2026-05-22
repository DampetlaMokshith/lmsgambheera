create table public.course_item_completions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  course_id text not null,
  item_id text not null,
  item_type text not null,
  section_id text null,
  completed_at timestamp with time zone null default now(),
  constraint course_item_completions_pkey primary key (id),
  constraint course_item_completions_user_id_course_id_item_id_item_type_key unique (user_id, course_id, item_id, item_type),
  constraint course_item_completions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint course_item_completions_item_type_check check (
    (
      item_type = any (
        array[
          'lecture'::text,
          'module'::text,
          'assignment'::text,
          'quiz'::text
        ]
      )
    )
  ),
  constraint valid_item_type check (
    (
      item_type = any (
        array[
          'lecture'::text,
          'module'::text,
          'assignment'::text,
          'quiz'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_completions_user_course on public.course_item_completions using btree (user_id, course_id) TABLESPACE pg_default;

create index IF not exists idx_completions_course on public.course_item_completions using btree (course_id) TABLESPACE pg_default;

create index IF not exists idx_completions_user on public.course_item_completions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_completions_item_type on public.course_item_completions using btree (item_type) TABLESPACE pg_default;

create index IF not exists idx_completions_completed_at on public.course_item_completions using btree (completed_at) TABLESPACE pg_default;

create trigger update_progress_on_completion
after INSERT
or DELETE on course_item_completions for EACH row
execute FUNCTION update_progress_summary ();