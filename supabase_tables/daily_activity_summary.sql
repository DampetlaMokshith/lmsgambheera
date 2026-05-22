create table public.daily_activity_summary (
  id bigserial not null,
  user_id uuid not null,
  activity_date date not null,
  total_sessions integer not null default 0,
  total_seconds integer not null default 0,
  total_hours numeric(8, 2) not null default 0.00,
  contribution_level integer not null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint daily_activity_summary_pkey primary key (id),
  constraint daily_activity_summary_user_id_activity_date_key unique (user_id, activity_date),
  constraint daily_activity_summary_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_daily_activity_summary_user_date on public.daily_activity_summary using btree (user_id, activity_date) TABLESPACE pg_default;