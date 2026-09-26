import { test } from "node:test";
import assert from "node:assert/strict";
import { calculators, futureValue, monthlyPayment } from "./simulate.js";

const metric = (r: { metrics: { key: string; value: number }[] }, key: string) => r.metrics.find((m) => m.key === key)?.value;

test("mortgage payment matches the standard French-amortization value", () => {
  // 200 000 at 3 % over 30 years → 843.21 €/month (textbook value)
  assert.equal(Math.round(monthlyPayment(200_000, 3, 360) * 100) / 100, 843.21);
  const r = calculators.mortgage({ price: 250_000, downPayment: 50_000, annualRate: 3, years: 30 });
  assert.equal(metric(r, "monthlyPayment"), 843.21);
  assert.equal(r.series.at(-1)?.value, 0, "fully repaid at the end");
});

test("zero-interest loan splits the amount evenly", () => {
  const r = calculators.loan({ amount: 12_000, annualRate: 0, years: 1 });
  assert.equal(metric(r, "monthlyPayment"), 1000);
  assert.equal(metric(r, "totalInterest"), 0);
});

test("monthly investment uses the future value of an annuity", () => {
  // 100 €/month, 5 %/year compounded monthly, 10 years → 15 528.23 €
  assert.equal(Math.round(futureValue(0, 100, 5, 120) * 100) / 100, 15528.23);
  const r = calculators.monthly_investment({ initial: 0, monthly: 100, annualReturn: 5, years: 10 });
  assert.equal(metric(r, "finalValue"), 15528.23);
  assert.equal(metric(r, "contributed"), 12000);
  assert.equal(r.series.length, 11);
});

test("inflation halves purchasing power at the rule-of-72 horizon", () => {
  const r = calculators.inflation({ amount: 1000, annualInflation: 7.2, years: 10 });
  assert.ok(Math.abs((metric(r, "purchasingPower") ?? 0) - 500) < 2);
});

test("retirement pot and 4 % rule income", () => {
  const r = calculators.retirement({
    currentAge: 30, retirementAge: 40, currentSavings: 0, monthlyContribution: 100, annualReturn: 5, withdrawalRate: 4,
  });
  assert.equal(metric(r, "potAtRetirement"), 15528.23);
  assert.equal(metric(r, "monthlyIncome"), 51.76);
});

test("car cost includes down payment, interest and running costs", () => {
  const r = calculators.car({ price: 20_000, downPayment: 20_000, annualRate: 5, years: 4, yearlyCosts: 1000 });
  assert.equal(metric(r, "monthlyPayment"), 0);
  assert.equal(metric(r, "totalCost"), 24_000);
});
