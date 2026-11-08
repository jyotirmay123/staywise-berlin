import assert from "node:assert/strict";
import test from "node:test";
import {
  investmentGrowth,
  investmentTimeline,
  latestValuation,
  portfolioTimeline,
} from "../lib/domain.ts";

const data = {
  version: 1,
  investments: [
    {
      id: "investment-1",
      name: "Long-term fund",
      category: "Equity",
      currency: "EUR",
      expectedAnnualReturn: 7,
      createdAt: "2026-01-01T08:00:00.000Z",
    },
  ],
  valuations: [
    {
      id: "old-same-day",
      investmentId: "investment-1",
      amount: 100,
      currency: "EUR",
      eurInrRate: 100,
      valuedAt: "2026-01-31",
      note: "",
      createdAt: "2026-01-31T08:00:00.000Z",
    },
    {
      id: "corrected-same-day",
      investmentId: "investment-1",
      amount: 110,
      currency: "EUR",
      eurInrRate: 100,
      valuedAt: "2026-01-31",
      note: "Correction",
      createdAt: "2026-01-31T09:00:00.000Z",
      updatedAt: "2026-01-31T10:00:00.000Z",
    },
    {
      id: "inr-month",
      investmentId: "investment-1",
      amount: 12_000,
      currency: "INR",
      eurInrRate: 100,
      valuedAt: "2026-02-28",
      note: "",
      createdAt: "2026-02-28T08:00:00.000Z",
    },
  ],
  lastFxRate: 100,
  lastFxDate: "2026-02-28",
  dataUpdatedAt: "2026-02-28T08:00:00.000Z",
};

test("chooses newest correction for same investment and date", () => {
  assert.equal(latestValuation(data, "investment-1")?.id, "inr-month");
  assert.deepEqual(investmentTimeline(data, "investment-1", "EUR"), [
    { date: "2026-01-31", value: 110 },
    { date: "2026-02-28", value: 120 },
  ]);
});

test("calculates multi-currency growth from historical FX", () => {
  assert.equal(
    Number(investmentGrowth(data, "investment-1")?.toFixed(2)),
    9.09,
  );
});

test("uses corrected values in overall time series", () => {
  assert.deepEqual(portfolioTimeline(data, "EUR"), [
    { date: "2026-01-31", value: 110 },
    { date: "2026-02-28", value: 120 },
  ]);
});
