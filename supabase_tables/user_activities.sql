create table public.user_activities (
  id bigserial not null,
  user_id uuid not null,
  activity_date date not null,
  activity_timestamp timestamp with time zone not null default now(),
  session_duration integer not null default 15,
  page_url text null,
  activity_type character varying(50) null default 'page_visit'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_activities_pkey primary key (id),
  constraint user_activities_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_activities_user_date on public.user_activities using btree (user_id, activity_date) TABLESPACE pg_default;

create index IF not exists idx_user_activities_timestamp on public.user_activities using btree (activity_timestamp) TABLESPACE pg_default;

create trigger trigger_update_daily_summary
after INSERT on user_activities for EACH row
execute FUNCTION update_daily_activity_summary ();