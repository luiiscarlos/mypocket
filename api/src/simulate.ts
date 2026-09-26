import { z } from "zod";

// Pure financial calculators. Rates are yearly percentages (3 = 3 %). Money is rounded to cents at the end.

export type Metric = { key: string; value: number };
export type Point = { period: number; value: number }; // period = year (0 = today)
export type SimulationResult = { metrics: Metric[]; series: Point[] };

const round2 = (n: number) => Math.round(n * 100) / 100;
const pct = z.number().min(0).max(50);
const money = z.number().min(0).max(1e10);
const years = z.number().int().min(1).max(60);

/** Fixed monthly payment of a French-amortization loan. */
export function monthlyPayment(principal: number, annualRatePct: number, months: number): number {
  const r = annualRatePct / 100 / 12;
  return r === 0 ? principal / months : (principal * r) / (1 - (1 + r) ** -months);
}

/** Remaining balance at the end of each year of a French-amortization loan. */
function balanceByYear(principal: number, annualRatePct: number, totalYears: number): Point[] {
  const r = annualRatePct / 100 / 12;
  const payment = monthlyPayment(principal, annualRatePct, totalYears * 12);
  const series: Point[] = [{ period: 0, value: round2(principal) }];
  let balance = principal;
  for (let month = 1; month <= totalYears * 12; month++) {
    balance = balance * (1 + r) - payment;
    if (month % 12 === 0) series.push({ period: month / 12, value: round2(Math.max(balance, 0)) });
  }
  return series;
}

function loanResult(principal: number, annualRate: number, totalYears: number): SimulationResult {
  const payment = monthlyPayment(principal, annualRate, totalYears * 12);
  const totalPaid = payment * totalYears * 12;
  return {
    metrics: [
      { key: "principal", value: round2(principal) },
      { key: "monthlyPayment", value: round2(payment) },
      { key: "totalPaid", value: round2(totalPaid) },
      { key: "totalInterest", value: round2(totalPaid - principal) },
    ],
    series: balanceByYear(principal, annualRate, totalYears),
  };
}

/** Future value with monthly compounding and a contribution at the end of each month. */
export function futureValue(initial: number, monthly: number, annualReturnPct: number, months: number): number {
  const r = annualReturnPct / 100 / 12;
  if (r === 0) return initial + monthly * months;
  return initial * (1 + r) ** months + monthly * (((1 + r) ** months - 1) / r);
}

export const simulationParams = {
  mortgage: z.object({ price: money, downPayment: money, annualRate: pct, years })
    .refine((p) => p.downPayment < p.price, "la entrada debe ser menor que el precio"),
  loan: z.object({ amount: money.positive(), annualRate: pct, years }),
  monthly_investment: z.object({ initial: money, monthly: money, annualReturn: pct, years }),
  inflation: z.object({ amount: money.positive(), annualInflation: pct, years }),
  car: z.object({ price: money, downPayment: money, annualRate: pct, years: z.number().int().min(1).max(10), yearlyCosts: money })
    .refine((p) => p.downPayment <= p.price, "la entrada no puede superar el precio"),
  retirement: z.object({
    currentAge: z.number().int().min(16).max(90),
    retirementAge: z.number().int().min(30).max(90),
    currentSavings: money,
    monthlyContribution: money,
    annualReturn: pct,
    withdrawalRate: z.number().min(1).max(10).default(4),
  }).refine((p) => p.retirementAge > p.currentAge, "la edad de jubilación debe ser mayor que la actual"),
} as const;

export type SimulationKind = keyof typeof simulationParams;
export const simulationKinds = Object.keys(simulationParams) as SimulationKind[];

type Params<K extends SimulationKind> = z.output<(typeof simulationParams)[K]>;

export const calculators: { [K in SimulationKind]: (p: Params<K>) => SimulationResult } = {
  mortgage: (p) => loanResult(p.price - p.downPayment, p.annualRate, p.years),

  loan: (p) => loanResult(p.amount, p.annualRate, p.years),

  monthly_investment: (p) => {
    const series: Point[] = [];
    for (let y = 0; y <= p.years; y++) series.push({ period: y, value: round2(futureValue(p.initial, p.monthly, p.annualReturn, y * 12)) });
    const finalValue = series[series.length - 1].value;
    const contributed = p.initial + p.monthly * p.years * 12;
    return {
      metrics: [
        { key: "finalValue", value: finalValue },
        { key: "contributed", value: round2(contributed) },
        { key: "gains", value: round2(finalValue - contributed) },
      ],
      series,
    };
  },

  inflation: (p) => {
    const factor = (y: number) => (1 + p.annualInflation / 100) ** y;
    const series: Point[] = [];
    for (let y = 0; y <= p.years; y++) series.push({ period: y, value: round2(p.amount / factor(y)) });
    return {
      metrics: [
        { key: "futureCost", value: round2(p.amount * factor(p.years)) },
        { key: "purchasingPower", value: round2(p.amount / factor(p.years)) },
        { key: "lossPercent", value: round2((1 - 1 / factor(p.years)) * 100) },
      ],
      series,
    };
  },

  car: (p) => {
    const financed = p.price - p.downPayment;
    const payment = financed > 0 ? monthlyPayment(financed, p.annualRate, p.years * 12) : 0;
    const series: Point[] = [];
    for (let y = 0; y <= p.years; y++) series.push({ period: y, value: round2(p.downPayment + payment * y * 12 + p.yearlyCosts * y) });
    return {
      metrics: [
        { key: "monthlyPayment", value: round2(payment) },
        { key: "monthlyTotal", value: round2(payment + p.yearlyCosts / 12) },
        { key: "interest", value: round2(payment * p.years * 12 - financed) },
        { key: "totalCost", value: series[series.length - 1].value },
      ],
      series,
    };
  },

  retirement: (p) => {
    const yearsToGo = p.retirementAge - p.currentAge;
    const series: Point[] = [];
    for (let y = 0; y <= yearsToGo; y++) {
      series.push({ period: y, value: round2(futureValue(p.currentSavings, p.monthlyContribution, p.annualReturn, y * 12)) });
    }
    const pot = series[series.length - 1].value;
    return {
      metrics: [
        { key: "yearsToRetirement", value: yearsToGo },
        { key: "potAtRetirement", value: pot },
        { key: "monthlyIncome", value: round2((pot * p.withdrawalRate) / 100 / 12) },
      ],
      series,
    };
  },
};
