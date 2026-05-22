create table public.notifications (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  type character varying(50) not null,
  title character varying(255) not null,
  message text not null,
  data jsonb null default '{}'::jsonb,
  read boolean null default false,
  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;