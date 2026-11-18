-- Link seeded exercises to their demo animations
UPDATE "exercises" SET "media_id" = v.media_id
FROM (VALUES
  ('לחיצת חזה עם משקולות יד', 'Dumbbell_Bench_Press'),
  ('חתירה ביד אחת עם משקולת', 'One-Arm_Dumbbell_Row'),
  ('גובלט סקוואט', 'Goblet_Squat'),
  ('לחיצת כתפיים בישיבה', 'Seated_Dumbbell_Press'),
  ('פולי עליון', 'Wide-Grip_Lat_Pulldown'),
  ('דדליפט רומני עם משקולות יד', 'Stiff-Legged_Dumbbell_Deadlift'),
  ('עליות על קופסה', 'Dumbbell_Step_Ups'),
  ('פלאנק', 'Plank'),
  ('פאלוף פרס', 'Pallof_Press'),
  ('דד באג', 'Dead_Bug')
) AS v(name, media_id)
WHERE "exercises"."name" = v.name AND "exercises"."media_id" IS NULL;
