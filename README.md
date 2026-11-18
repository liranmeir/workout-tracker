# workout-tracker

יומן אימוני כוח אישי: Next.js 16 + Drizzle + Neon Postgres, מאוחסן ב-Vercel.

- אימונים עם תרגילים, חלקים (חימום / עיקרי / ליבה / סיום) וזוגות (סופר-סטים)
- סימון סטים בזמן אמת, משקל לכל תרגיל, טיימר מנוחה
- היסטוריה והתקדמות במשקלים
- כניסה בסיסמה אחת (משתמש יחיד)

## משתני סביבה
| שם | מה |
|---|---|
| `DATABASE_URL` | נוצר אוטומטית ע״י אינטגרציית Neon ב-Vercel |
| `APP_PASSWORD` | סיסמת הכניסה |
| `AUTH_SECRET` | מחרוזת אקראית לחתימת העוגייה |

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
השרת זמין ב-`/api/mcp/<MCP_SECRET>` (Streamable HTTP, stateless).
כלים: `list_workouts`, `save_workout`, `set_workout_day`, `delete_workout`, `get_history`, `get_progress`, `log_workout`, `search_exercise_demos`.
הסוד נמצא בנתיב, כך שהחיבור עובד כ-Custom Connector ב-claude.ai בלי OAuth. מי שיש לו את ה-URL יכול לקרוא ולשנות נתונים – לא לשתף אותו.
להחלפת הסוד: לשנות את `MCP_SECRET` ב-Vercel, לעשות redeploy, ולעדכן את ה-URL בקונקטור.

## בדיקות
```bash
npm test          # הרצה חד-פעמית (Vitest)
npm run test:watch
```
הבדיקות רצות אוטומטית כחלק מ-`npm run build`, ולכן ב-Vercel בדיקה שנכשלה עוצרת את ה-deploy. כללי העבודה ל-Claude נמצאים ב-`CLAUDE.md`.
