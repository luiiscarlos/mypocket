import { test } from "node:test";
import assert from "node:assert/strict";
import { chargesUntil, debtStatus, endOfMonth, nextOccurrence, occurrence, occurrencesBetween } from "./schedule.js";

const monthly = (start: string, extra = {}) => ({ start, unit: "month" as const, count: 1, ...extra });

test("month steps keep the day and clamp short months", () => {
  const s = monthly("2026-01-31");
  assert.equal(occurrence(s, 1), "2026-02-28");
  assert.equal(occurrence(s, 2), "2026-03-31");
  assert.equal(occurrence({ start: "2024-02-29", unit: "year", count: 1 }, 1), "2025-02-28");
  assert.equal(occurrence({ start: "2026-09-27", unit: "week", count: 2 }, 3), "2026-11-08");
});

test("next charge from an old start date", () => {
  assert.equal(nextOccurrence(monthly("2020-03-05"), "2026-09-27"), "2026-10-05");
  assert.equal(nextOccurrence(monthly("2020-03-05"), "2026-10-05"), "2026-10-05", "today counts as next");
  assert.equal(nextOccurrence(monthly("2026-12-01"), "2026-09-27"), "2026-12-01", "future start");
  assert.equal(nextOccurrence(monthly("2026-01-10", { paymentsTotal: 3 }), "2026-09-27"), null, "finished");
  assert.equal(nextOccurrence(monthly("2026-01-10", { endDate: "2026-10-09" }), "2026-09-27"), null, "past end date");
});

test("charges in a range and charges made", () => {
  assert.deepEqual(occurrencesBetween({ start: "2026-09-01", unit: "week", count: 1 }, "2026-09-27", "2026-09-30"), ["2026-09-29"]);
  assert.equal(chargesUntil(monthly("2026-01-15"), "2026-09-14"), 8);
  assert.equal(chargesUntil(monthly("2026-01-15"), "2026-09-15"), 9);
  assert.equal(chargesUntil(monthly("2026-10-01"), "2026-09-27"), 0);
});

test("debt started in the past: paid, remaining and end date", () => {
  // 6 000 € at 250 €/month since 15 Jan 2026 → 24 installments, last one 15 Dec 2027.
  const d = debtStatus(6000, 250, monthly("2026-01-15"), "2026-09-27");
  assert.equal(d.paid, 2250);
  assert.equal(d.remaining, 3750);
  assert.equal(d.endsOn, "2027-12-15");
  assert.equal(d.next, "2026-10-15");
  assert.equal(d.paymentsLeft, 15);
  // Last installment is smaller: 1 000 € at 300 € → 4 installments, fully paid after the 4th.
  const done = debtStatus(1000, 300, monthly("2026-01-01"), "2026-09-27");
  assert.equal(done.remaining, 0);
  assert.equal(done.next, null);
  assert.equal(done.progress, 1);
});

test("end of month", () => {
  assert.equal(endOfMonth("2026-02-10"), "2026-02-28");
  assert.equal(endOfMonth("2026-09-27"), "2026-09-30");
});
