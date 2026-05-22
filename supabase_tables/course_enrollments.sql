create table public.course_enrollments (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  course_id uuid not null,
  enrolled_at timestamp with time zone null default now(),
  progress numeric(5, 2) null default 0,
  completed_at timestamp with time zone null,
  status text null default 'active'::text,
  last_accessed timestamp with time zone null default now(),
  certificate_issued boolean null default false,
  certificate_url text null,
  user_name text null,
  user_email text null,
  constraint course_enrollments_pkey primary key (id),
  constraint course_enrollments_user_id_course_id_key unique (user_id, course_id),
  constraint course_enrollments_course_id_fkey foreign KEY (course_id) references courses (id) on delete CASCADE,
  constraint course_enrollments_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint course_enrollments_progress_check check (
    (
      (progress >= (0)::numeric)
      and (progress <= (100)::numeric)
    )
  ),
  constraint course_enrollments_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'completed'::text,
          'paused'::text,
          'dropped'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_enrollments_user_id on public.course_enrollments using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_enrollments_course_id on public.course_enrollments using btree (course_id) TABLESPACE pg_default;

create index IF not exists idx_enrollments_status on public.course_enrollments using btree (status) TABLESPACE pg_default;

create index IF not exists idx_enrollments_enrolled_at on public.course_enrollments using btree (enrolled_at) TABLESPACE pg_default;

create trigger trigger_update_enrollment_count
after INSERT
or DELETE
or
update on course_enrollments for EACH row
execute FUNCTION update_course_enrollment_count ();