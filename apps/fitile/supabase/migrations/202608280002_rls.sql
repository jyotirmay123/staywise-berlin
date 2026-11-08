do $$ declare table_name text; begin
  foreach table_name in array array['profiles','user_preferences','goals','limitations','user_equipment','exercise_preferences','workout_sessions','set_logs','recovery_events','soreness_checkins','meals','meal_entries','hydration_logs','food_photo_analyses','activities','body_measurements','health_imports','ai_requests','sync_conflicts'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I_select_own on public.%I for select using ((select auth.uid()) = user_id)', table_name, table_name);
    execute format('create policy %I_insert_own on public.%I for insert with check ((select auth.uid()) = user_id)', table_name, table_name);
    execute format('create policy %I_update_own on public.%I for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name, table_name);
    execute format('create policy %I_delete_own on public.%I for delete using ((select auth.uid()) = user_id)', table_name, table_name);
  end loop;
end $$;

alter table public.foods enable row level security;
create policy foods_read_shared_or_own on public.foods for select using (user_id is null or (select auth.uid()) = user_id);
create policy foods_write_own on public.foods for insert with check ((select auth.uid()) = user_id);
create policy foods_update_own on public.foods for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy foods_delete_own on public.foods for delete using ((select auth.uid()) = user_id);

alter table public.muscles enable row level security;
alter table public.equipment_types enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_muscles enable row level security;
create policy muscles_authenticated_read on public.muscles for select to authenticated using (true);
create policy equipment_authenticated_read on public.equipment_types for select to authenticated using (true);
create policy exercises_authenticated_read on public.exercises for select to authenticated using (true);
create policy exercise_muscles_authenticated_read on public.exercise_muscles for select to authenticated using (true);

insert into storage.buckets (id, name, public) values ('food-photos', 'food-photos', false) on conflict (id) do nothing;
create policy food_photos_own_select on storage.objects for select using (bucket_id = 'food-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy food_photos_own_insert on storage.objects for insert with check (bucket_id = 'food-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy food_photos_own_delete on storage.objects for delete using (bucket_id = 'food-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
