insert into public.muscles (id, name, region, recovery_hours) values
('chest','Chest','upper',72),('front-delts','Front delts','upper',60),('side-delts','Side delts','upper',48),
('rear-delts','Rear delts','upper',48),('triceps','Triceps','upper',60),('biceps','Biceps','upper',48),
('forearms','Forearms','upper',36),('upper-back','Upper back','upper',72),('lats','Lats','upper',72),
('lower-back','Lower back','core',96),('abs','Abs','core',36),('obliques','Obliques','core',48),
('glutes','Glutes','lower',72),('quadriceps','Quadriceps','lower',72),('hamstrings','Hamstrings','lower',72),
('calves','Calves','lower',48),('hip-flexors','Hip flexors','lower',48),('adductors','Adductors','lower',60),
('cardiovascular','Cardiovascular','system',24) on conflict (id) do update set name = excluded.name;

insert into public.equipment_types (id, name, capabilities) values
('bodyweight','Bodyweight',array['bodyweight']),
('adjustable-dumbbells','Adjustable dumbbells',array['dumbbell']),
('adjustable-bench','Adjustable bench',array['flat-bench','incline-bench','seated-bench']),
('bench-cables','Bench cable attachments',array['low-cable','high-cable','resistance-band']),
('twister','Waist twister',array['twister']),
('treadmill','Treadmill',array['treadmill']) on conflict (id) do update set capabilities = excluded.capabilities;
