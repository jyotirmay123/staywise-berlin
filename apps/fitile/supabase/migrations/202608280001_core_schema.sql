create extension if not exists pgcrypto;

create function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = timezone('utc', now()); return new; end; $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null default '', profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.user_preferences (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, value jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table public.goals (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, goal_data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table public.limitations (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, tag text not null, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);

create table public.muscles (id text primary key, name text not null, region text not null, recovery_hours integer not null);
create table public.equipment_types (id text primary key, name text not null, capabilities text[] not null default '{}');
create table public.exercises (id text primary key, name text not null, exercise_data jsonb not null, catalog_version integer not null default 1);
create table public.exercise_muscles (exercise_id text not null references public.exercises(id) on delete cascade, muscle_id text not null references public.muscles(id), role text not null, contribution numeric not null, primary key (exercise_id, muscle_id));

create table public.user_equipment (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, name text not null, capabilities text[] not null, equipment_data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table public.exercise_preferences (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, exercise_id text not null references public.exercises(id), preference text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz, unique(user_id, exercise_id));

create table public.workout_sessions (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, source text not null, split text not null, status text not null, session_data jsonb not null default '{}'::jsonb, started_at timestamptz, completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table public.set_logs (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, session_id uuid not null references public.workout_sessions(id) on delete cascade, exercise_id text not null references public.exercises(id), set_number integer not null, weight_kg numeric, repetitions integer, duration_seconds integer, distance_meters numeric, rpe numeric, rir numeric, completed_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table public.recovery_events (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, muscle_id text not null references public.muscles(id), fatigue numeric not null, occurred_at timestamptz not null, recovery_hours numeric not null, source_label text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table public.soreness_checkins (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, muscle_id text not null references public.muscles(id), soreness integer not null check (soreness between 0 and 10), readiness_override integer check (readiness_override between 0 and 100), checked_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);

create table public.foods (id uuid primary key, user_id uuid references auth.users(id) on delete cascade, name text not null, brand text, barcode text, source text not null, source_id text, food_data jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table public.meals (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, name text, meal_type text not null, eaten_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table public.meal_entries (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, meal_id uuid references public.meals(id) on delete cascade, food_id uuid references public.foods(id), grams numeric not null, food_snapshot jsonb not null, eaten_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table public.hydration_logs (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, milliliters integer not null, logged_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table public.food_photo_analyses (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, status text not null, result jsonb, retained_path text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);

create table public.activities (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, activity_type text not null, activity_data jsonb not null, started_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table public.body_measurements (id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade, measurement_data jsonb not null, measured_at timestamptz not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz);
create table public.health_imports (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, source_id text not null, source_name text not null, record_type text not null, imported_at timestamptz not null default now(), unique(user_id, source_name, source_id));
create table public.ai_requests (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, purpose text not null, model text not null, usage_data jsonb not null default '{}'::jsonb, validation_result text not null, created_at timestamptz not null default now());
create table public.sync_conflicts (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, entity text not null, entity_id text not null, conflict_data jsonb not null, created_at timestamptz not null default now());

do $$ declare table_name text; begin
  foreach table_name in array array['profiles','user_preferences','goals','limitations','user_equipment','exercise_preferences','workout_sessions','set_logs','recovery_events','soreness_checkins','foods','meals','meal_entries','hydration_logs','food_photo_analyses','activities','body_measurements'] loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
    execute format('create index %I_user_updated_idx on public.%I (user_id, updated_at desc)', table_name, table_name);
  end loop;
end $$;
