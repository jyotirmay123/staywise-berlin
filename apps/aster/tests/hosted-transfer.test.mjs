import assert from "node:assert/strict";
import test from "node:test";
import {
  SOURCE_ORIGIN, DESTINATION_URL, createTransferMessage,
  parseTransferMessage, isTransferAcknowledgement, selectSnapshot,
} from "../lib/hosted-transfer.ts";

const nonce = "a1".repeat(32);
const data = {
  version: 1,
  investments: [{ id: "fund", name: "Fund", category: "Equity", currency: "EUR", expectedAnnualReturn: 7, createdAt: "2026-01-01T00:00:00Z" }],
  valuations: [{ id: "value", investmentId: "fund", amount: 42, currency: "EUR", eurInrRate: 100, valuedAt: "2026-01-01", note: "", createdAt: "2026-01-01T00:00:00Z" }],
  lastFxRate: 100, lastFxDate: "2026-01-01", dataUpdatedAt: "2026-10-24T12:00:00Z",
};

test("binds the protocol to the original private Site and exact GitHub app", () => {
  assert.equal(SOURCE_ORIGIN, "https://aster-portfolio-ledger.senapati-jyotirmay.chatgpt.site");
  assert.equal(DESTINATION_URL, "https://jyotirmay123.github.io/staywise-berlin/apps/aster/");
});

test("transfers only validated portfolio records and strips extra credentials", () => {
  const dirty = { ...data, vaultKey: "secret", investments: [{ ...data.investments[0], token: "secret" }] };
  const message = createTransferMessage(nonce, dirty);
  assert.deepEqual(message, { type: "aster-transfer-v1", nonce, payload: data });
  assert.deepEqual(parseTransferMessage({ ...message, credentials: "secret" }, nonce), data);
  assert.ok(!JSON.stringify(message).includes("secret"));
});

test("rejects a wrong type, mismatched or malformed nonce, invalid records and orphan valuations", () => {
  const message = createTransferMessage(nonce, data);
  for (const value of [null, [], { ...message, type: "other" }, { ...message, nonce: "b2".repeat(32) }, { ...message, payload: { ...data, valuations: [{ ...data.valuations[0], investmentId: "missing" }] } }, { ...message, payload: { ...data, lastFxRate: "100" } }]) {
    assert.equal(parseTransferMessage(value, nonce), null);
  }
  assert.equal(parseTransferMessage(message, "short"), null);
  assert.throws(() => createTransferMessage("short", data), /nonce/i);
  assert.throws(() => createTransferMessage(nonce, { ...data, valuations: [data.valuations[0], data.valuations[0]] }), /Duplicate/);
});

test("accepts acknowledgement only for the matching request", () => {
  assert.equal(isTransferAcknowledgement({ type: "aster-transfer-ack-v1", nonce }, nonce), true);
  assert.equal(isTransferAcknowledgement({ type: "aster-transfer-ack-v1", nonce: "b2".repeat(32) }, nonce), false);
  assert.equal(isTransferAcknowledgement({ type: "aster-transfer-v1", nonce }, nonce), false);
  assert.equal(isTransferAcknowledgement(null, nonce), false);
});

test("prefers newer browser edits over a later server save of older contents", () => {
  const account = { source: "Account cloud", data, savedAt: "2026-11-08T12:00:00Z" };
  const device = { source: "This device", data: { ...data, dataUpdatedAt: "2026-11-01T12:00:00Z" }, savedAt: "2026-11-01T12:00:00Z" };
  assert.equal(selectSnapshot([account, device])?.source, "This device");
});

test("preserves a newer complete snapshot with deletions instead of combining older records", () => {
  const deleted = { ...data, investments: [], valuations: [], dataUpdatedAt: "2026-11-02T12:00:00Z" };
  assert.deepEqual(selectSnapshot([{ source: "Older", data, savedAt: "" }, { source: "Deleted", data: deleted, savedAt: "" }])?.data, deleted);
});

test("ignores pristine empty and invalid snapshots and handles legacy missing update metadata", () => {
  const empty = { ...data, investments: [], valuations: [], dataUpdatedAt: "" };
  assert.equal(selectSnapshot([{ source: "Empty", data: empty, savedAt: "2026-11-08T00:00:00Z" }]), null);
  const invalid = { ...data, valuations: [{ ...data.valuations[0], amount: -1 }] };
  const legacy = { ...data, dataUpdatedAt: "" };
  assert.equal(selectSnapshot([{ source: "Invalid", data: invalid, savedAt: "" }, { source: "Legacy", data: legacy, savedAt: "2026-01-01T00:00:00Z" }])?.source, "Legacy");
});
