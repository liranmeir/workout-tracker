-- Seed: Tuesday strength workout
WITH w AS (
  INSERT INTO "workouts" ("name", "day_of_week", "note")
  VALUES ('כוח – שלישי', 2, 'שעה בקאנטרי · גוף עליון וליבה, רגליים בינוני (כדורסל שני ורביעי)')
  RETURNING "id"
)
INSERT INTO "exercises" ("workout_id", "section", "name", "kind", "sets", "reps", "pair", "tip", "default_weight", "position")
SELECT w."id", v.section, v.name, v.kind, v.sets, v.reps, v.pair, v.tip, v.default_weight, v.position
FROM w, (VALUES
  ('חימום', '5 דק׳ אופניים או חתירה בקצב קל', 'check', 1, '', NULL::text, NULL::text, NULL::numeric, 0),
  ('חימום', 'סקוואט במשקל גוף', 'check', 1, '×10', NULL, NULL, NULL, 1),
  ('חימום', 'מתיחה דינמית לירך אחורית', 'check', 1, '', NULL, NULL, NULL, 2),
  ('חימום', 'סיבובי כתפיים', 'check', 1, '', NULL, NULL, NULL, 3),
  ('חלק עיקרי', 'לחיצת חזה עם משקולות יד', 'sets', 3, '8–10', 'A', NULL, NULL, 4),
  ('חלק עיקרי', 'חתירה ביד אחת עם משקולת', 'sets', 3, '10 לכל יד', 'A', 'ברך ויד על הספסל, גב ישר, מרפק אחורה למותן', 12, 5),
  ('חלק עיקרי', 'גובלט סקוואט', 'sets', 3, '8', 'B', 'משקל בינוני, 2–3 חזרות ברזרבה', 14, 6),
  ('חלק עיקרי', 'לחיצת כתפיים בישיבה', 'sets', 3, '10', 'B', 'גב צמוד למשענת, לא לנעול מרפקים', 8, 7),
  ('חלק עיקרי', 'פולי עליון', 'sets', 3, '10', 'C', 'מושכים לחזה העליון, לא מאחורי הצוואר', 35, 8),
  ('חלק עיקרי', 'דדליפט רומני עם משקולות יד', 'sets', 3, '8', 'C', 'גב ישר, תנועה מהאגן, לא עד כשל', 12, 9),
  ('חלק עיקרי', 'עליות על קופסה', 'sets', 2, '8 לכל רגל', NULL, 'משקל גוף או עד 6–8 ק״ג. רגליים עייפות? רק זה + RDL קל', NULL, 10),
  ('ליבה', 'פלאנק', 'sets', 3, '40 שנ׳', NULL, NULL, NULL, 11),
  ('ליבה', 'פאלוף פרס', 'sets', 2, '10 לכל צד', NULL, NULL, NULL, 12),
  ('ליבה', 'דד באג', 'sets', 2, '10', NULL, NULL, NULL, 13),
  ('סיום ומתיחות', 'ירך קדמית', 'check', 1, '', NULL, NULL, NULL, 14),
  ('סיום ומתיחות', 'תאומים', 'check', 1, '', NULL, NULL, NULL, 15),
  ('סיום ומתיחות', 'חזה', 'check', 1, '', NULL, NULL, NULL, 16)
) AS v(section, name, kind, sets, reps, pair, tip, default_weight, position);
