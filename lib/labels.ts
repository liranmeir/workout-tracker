/** Text for a workout card's main action and its "next" tag. */
export function startLabel(hasOpenSession: boolean) {
  return hasOpenSession ? "◀ המשך אימון" : "◀ התחל אימון";
}

export function nextTag(hasOpenSession: boolean) {
  return hasOpenSession ? "אימון בעיצומו" : "האימון הבא";
}
