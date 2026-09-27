// Pure date math for recurring items (subscriptions, fixed expenses, debts, recurring income).
// Dates are "YYYY-MM-DD" strings handled in UTC, so no time zone shifts a charge by a day.

export type Unit = "week" | "month" | "year";

export type Schedule = {
  /** First charge. */
  start: string;
  unit: Unit;
  /** Every `count` units (e.g. 3 months). */
  count: number;
  /** Last possible charge date, inclusive. */
  endDate?: string | null;
  /** Number of charges in total. */
  paymentsTotal?: number | null;
};

const parse = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return { y, m: m - 1, day };
};
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** n-th charge (0 = start). Month steps keep the day of month, clamped to shorter months (31 Jan → 28 Feb). */
export function occurrence(s: Schedule, n: number): string {
  const { y, m, day } = parse(s.start);
  if (s.unit === "week") return iso(Date.UTC(y, m, day + 7 * s.count * n));
  const months = (s.unit === "month" ? 1 : 12) * s.count * n;
  const lastDay = new Date(Date.UTC(y, m + months + 1, 0)).getUTCDate();
  return iso(Date.UTC(y, m + months, Math.min(day, lastDay)));
}

const withinLimits = (s: Schedule, n: number, date: string) =>
  (s.paymentsTotal == null || n < s.paymentsTotal) && (!s.endDate || date <= s.endDate);

/** Index of the first charge on or after `date` (a lower bound estimate, then stepped forward). */
function firstIndexFrom(s: Schedule, date: string): number {
  if (date <= s.start) return 0;
  const a = parse(s.start);
  const b = parse(date);
  const approx =
    s.unit === "week"
      ? Math.floor((Date.UTC(b.y, b.m, b.day) - Date.UTC(a.y, a.m, a.day)) / (7 * s.count * 86_400_000))
      : Math.floor(((b.y - a.y) * 12 + (b.m - a.m)) / ((s.unit === "month" ? 1 : 12) * s.count));
  let n = Math.max(0, approx - 1);
  while (occurrence(s, n) < date) n++;
  return n;
}

/** Next charge on or after `today`, or null when the schedule has ended. */
export function nextOccurrence(s: Schedule, today: string): string | null {
  const n = firstIndexFrom(s, today);
  const date = occurrence(s, n);
  return withinLimits(s, n, date) ? date : null;
}

/** Charges between `from` and `to`, both inclusive. */
export function occurrencesBetween(s: Schedule, from: string, to: string): string[] {
  const out: string[] = [];
  for (let n = firstIndexFrom(s, from); ; n++) {
    const date = occurrence(s, n);
    if (date > to || !withinLimits(s, n, date)) return out;
    out.push(date);
  }
}

/** Charges already made up to `today`, inclusive. */
export function chargesUntil(s: Schedule, today: string): number {
  if (today < s.start) return 0;
  const made = firstIndexFrom(s, today) + (occurrence(s, firstIndexFrom(s, today)) === today ? 1 : 0);
  return s.paymentsTotal == null ? made : Math.min(made, s.paymentsTotal);
}

const round2 = (v: number) => Math.round(v * 100) / 100;

/**
 * Debt paid off by fixed installments: `initial` owed at `start`, `amount` paid on each charge.
 * The schedule ends by itself once the installments cover the debt.
 */
export function debtStatus(initial: number, amount: number, s: Schedule, today: string) {
  const installments = Math.ceil(round2(initial / amount) - 1e-9);
  const plan = { ...s, paymentsTotal: s.paymentsTotal == null ? installments : Math.min(s.paymentsTotal, installments) };
  const paidCount = chargesUntil(plan, today);
  const paid = round2(Math.min(initial, paidCount * amount));
  return {
    paid,
    remaining: round2(initial - paid),
    progress: initial > 0 ? round2(paid / initial) : 1,
    endsOn: occurrence(plan, plan.paymentsTotal - 1),
    next: nextOccurrence(plan, today),
    paymentsLeft: plan.paymentsTotal - paidCount,
    /** The schedule capped at the installments that pay the debt off. */
    plan,
  };
}

/** Last day of the month of `date`. */
export const endOfMonth = (date: string) => {
  const { y, m } = parse(date);
  return iso(Date.UTC(y, m + 1, 0));
};
