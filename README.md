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
