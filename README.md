# workout-tracker

יומן אימוני כוח אישי: Next.js 16 + Drizzle + Neon Postgres, מאוחסן ב-Vercel.

- אימונים עם תרגילים, חלקים (חימום / עיקרי / ליבה / סיום) וזוגות (סופר-סטים)
- סימון סטים בזמן אמת, משקל לכל תרגיל, טיימר מנוחה
- היסטוריה והתקדמות במשקלים
- כמה משתמשים: לכל אחד אימונים, היסטוריה וחיבור MCP משלו

## משתני סביבה
| שם | מה |
|---|---|
| `DATABASE_URL` | נוצר אוטומטית ע״י אינטגרציית Neon ב-Vercel |
| `AUTH_SECRET` | מחרוזת אקראית לחתימת העוגייה |
| `APP_PASSWORD_<USERNAME>` | סיסמת הכניסה של כל משתמש, למשל `APP_PASSWORD_ASI` |
| `MCP_SECRET_<USERNAME>` | הסוד בכתובת ה-MCP של כל משתמש (24 תווים לפחות) |

ל-`liran` יש גם גיבוי לשמות הישנים `APP_PASSWORD` ו-`MCP_SECRET`.

## משתמשים
המשתמשים יושבים בטבלה `users` (שם משתמש ושם תצוגה), והסיסמאות רק במשתני הסביבה – שום סוד לא נכנס לרפו.
אימונים שייכים למשתמש (`workouts.user_id`), ואימונים, סטים ומשקלים שייכים אליו דרך האימון.
להוספת משתמש: מיגרציה שמכניסה שורה ל-`users`, ואז `APP_PASSWORD_<USERNAME>` ו-`MCP_SECRET_<USERNAME>` ב-Vercel ו-redeploy.

## פיתוח
```bash
npm i
cp .env.example .env.local   # למלא ערכים
npm run db:migrate
npm run dev
```

מיגרציות רצות אוטומטית לפני `next build`. שינוי בסכמה: לערוך `lib/schema.ts` ואז `npm run db:generate`.

## הדגמות תרגילים
התמונות מגיעות מ-[free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Public Domain).
לכל תרגיל שתי תמונות (התחלה וסיום) שמתחלפות בלופ. התמונות של האימון הקיים יושבות ב-`public/demos`, השאר נטענות מ-GitHub.

## MCP (חיבור ל-Claude)
השרת זמין ב-`/api/mcp/<MCP_SECRET_<USERNAME>>`, וכל סוד רואה רק את הנתונים של המשתמש שלו (Streamable HTTP, stateless).
כלים: `list_workouts`, `save_workout`, `set_workout_day`, `delete_workout`, `get_history`, `get_progress`, `log_workout`, `search_exercise_demos`.
הסוד נמצא בנתיב, כך שהחיבור עובד כ-Custom Connector ב-claude.ai בלי OAuth. מי שיש לו את ה-URL יכול לקרוא ולשנות נתונים – לא לשתף אותו.
להחלפת הסוד: לשנות את `MCP_SECRET_<USERNAME>` ב-Vercel, לעשות redeploy, ולעדכן את ה-URL בקונקטור.

## בדיקות
```bash
npm test          # הרצה חד-פעמית (Vitest)
npm run test:watch
```
הבדיקות רצות אוטומטית כחלק מ-`npm run build`, ולכן ב-Vercel בדיקה שנכשלה עוצרת את ה-deploy. כללי העבודה ל-Claude נמצאים ב-`CLAUDE.md`.
