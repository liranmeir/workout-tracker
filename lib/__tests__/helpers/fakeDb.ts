/**
 * Minimal chainable stand-in for the drizzle `db()` object.
 * Queue the rows each query should resolve to, run the code, then inspect `calls`.
 */
type Op = "select" | "insert" | "update" | "delete";

export function createFakeDb() {
  const queues: Record<Op, unknown[][]> = { select: [], insert: [], update: [], delete: [] };
  const calls: { op: Op; values?: unknown; set?: unknown }[] = [];

  const start = (op: Op) => {
    const call: { op: Op; values?: unknown; set?: unknown } = { op };
    calls.push(call);
    const result = () => queues[op].shift() ?? [];
    const chain: Record<string, unknown> = {
      values: (v: unknown) => ((call.values = v), chain),
      set: (v: unknown) => ((call.set = v), chain),
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(result()).then(res, rej),
    };
    for (const m of ["from", "where", "orderBy", "returning", "innerJoin", "limit"]) chain[m] = () => chain;
    return chain;
  };

  return {
    db: { select: () => start("select"), insert: () => start("insert"), update: () => start("update"), delete: () => start("delete") },
    queue: (op: Op, ...results: unknown[][]) => void queues[op].push(...results),
    calls,
    of: (op: Op) => calls.filter((c) => c.op === op),
  };
}
