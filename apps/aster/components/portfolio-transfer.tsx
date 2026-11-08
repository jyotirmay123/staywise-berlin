"use client";

import { useEffect, useRef, useState } from "react";
import {
  createTransferMessage, DESTINATION_ORIGIN, DESTINATION_URL,
  isTransferAcknowledgement, selectSnapshot, snapshotUpdatedAt,
  type TransferCandidate,
} from "@/lib/hosted-transfer";
import { localStore } from "@/lib/local-store";
import { parsePortfolioExport } from "@/lib/portable-data";
import { exportPortfolio, pullAccountPortfolio, pullVault } from "@/lib/services";

function displayDate(value: string): string {
  return value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "Not recorded";
}

export function PortfolioTransfer({ nonce }: { nonce: string | null }) {
  const [candidates, setCandidates] = useState<TransferCandidate[]>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [hasOpener, setHasOpener] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "saved">("idle");
  const pendingOpener = useRef<Window | null>(null);
  const selected = candidates.find((item) => item.source === selectedSource);
  const latest = selectSnapshot(candidates);

  useEffect(() => {
    let active = true;
    async function load() {
      const loaded: TransferCandidate[] = [];
      const notices: string[] = [];
      function add(candidate: TransferCandidate) {
        try {
          loaded.push({ ...candidate, data: parsePortfolioExport(JSON.stringify(candidate.data)) });
        } catch {
          notices.push(`${candidate.source}: incomplete or invalid portfolio; this copy cannot be transferred.`);
        }
      }
      await Promise.all([
        (async () => {
          try {
            const account = await pullAccountPortfolio();
            if (account) add({ source: "Account cloud", data: account.data, savedAt: account.state.updatedAt });
            else notices.push("Account cloud: no saved portfolio found.");
          } catch {
            notices.push("Account cloud could not be read. Reopen this page while online to compare it.");
          }
        })(),
        (async () => {
          try {
            const device = await localStore.loadPortfolio();
            if (device) add({ source: "This device", data: device, savedAt: device.dataUpdatedAt ?? "" });
          } catch {
            notices.push("This device's saved portfolio could not be read.");
          }
          try {
            const credentials = await localStore.loadCredentials();
            if (credentials) {
              const vault = await pullVault(credentials.vaultId, credentials.vaultKey);
              add({ source: "Recovery cloud", data: vault.data, savedAt: vault.credentials.updatedAt });
            }
          } catch {
            notices.push("Recovery cloud could not be read. Account and device copies are shown below.");
          }
        })(),
      ]);
      if (!active) return;
      setCandidates(loaded);
      setSelectedSource(selectSnapshot(loaded)?.source ?? "");
      setWarnings(notices);
      setHasOpener(Boolean(window.opener && !window.opener.closed));
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function receive(event: MessageEvent) {
      if (!nonce || !pendingOpener.current || event.origin !== DESTINATION_ORIGIN || event.source !== pendingOpener.current) return;
      if (!isTransferAcknowledgement(event.data, nonce)) return;
      setStatus("saved");
      pendingOpener.current = null;
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [nonce]);

  function send() {
    if (!selected || !nonce || !window.opener || window.opener.closed) {
      setHasOpener(false);
      return;
    }
    pendingOpener.current = window.opener;
    window.opener.postMessage(createTransferMessage(nonce, selected.data), DESTINATION_ORIGIN);
    setStatus("sent");
  }

  return (
    <main className="transfer-shell">
      <header>
        <p className="eyebrow">Aster · Private portfolio</p>
        <h1>Bring your portfolio with you.</h1>
        <p>Choose one complete copy to send to your GitHub Aster app. Your investments, valuations and FX history stay together, including any deletions.</p>
      </header>
      <section className="panel transfer-panel" aria-label="Choose portfolio copy">
        <h2>Choose your source</h2>
        {loading ? <p role="status">Reading your account, cloud and device copies…</p> : (
          <>
            {latest && <p className="transfer-note">The copy with the newest recorded content edit is selected. Review the counts and timestamps before sending.</p>}
            {!candidates.length && <p>No complete portfolio was found. Open your original Aster app on a device with your saved data, then return here.</p>}
            <div className="transfer-candidates">
              {candidates.map((candidate) => (
                <label className="transfer-candidate" key={candidate.source}>
                  <input type="radio" name="transfer-source" value={candidate.source} checked={selectedSource === candidate.source} disabled={status === "sent" || status === "saved"} onChange={() => { setSelectedSource(candidate.source); setStatus("idle"); }} />
                  <span>
                    <strong>{candidate.source} {latest?.source === candidate.source && <small>Newest recorded edit</small>}</strong>
                    <span>{candidate.data.investments.length} investments · {candidate.data.valuations.length} valuations</span>
                    <span>Content edited: {displayDate(snapshotUpdatedAt(candidate))}</span>
                    <span>{candidate.source === "This device" ? "Device recorded" : "Cloud saved"}: {displayDate(candidate.savedAt)}</span>
                  </span>
                </label>
              ))}
            </div>
            {warnings.length > 0 && <ul className="transfer-warnings">{warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
            {selected && <p className="transfer-note">Only the selected portfolio will be sent to <a href={DESTINATION_URL} target="_blank" rel="noreferrer">GitHub Aster</a>. Recovery keys and sign-in details are excluded.</p>}
            {nonce && hasOpener ? (
              <button className="primary-button" type="button" disabled={!selected || status !== "idle"} onClick={send}>Send to GitHub Aster</button>
            ) : (
              <p className="transfer-note">{nonce ? "The connection to the GitHub tab was lost during sign-in." : "Open this page using Import from private Aster in your GitHub app to send directly."} You can also download the selected copy and import the JSON file there.</p>
            )}
            <p role="status" aria-live="polite">{status === "sent" ? "Sent. Return to the GitHub tab to review and confirm the import. Waiting for confirmation that it has been saved…" : status === "saved" ? "Your GitHub Aster app confirmed that this portfolio has been saved on this device." : ""}</p>
            {selected && status !== "saved" && (
              <div className="button-row">
                <button className="secondary-button" type="button" onClick={() => exportPortfolio(parsePortfolioExport(JSON.stringify(selected.data)))}>Download JSON</button>
                <a className="secondary-button" href={DESTINATION_URL} target="_blank" rel="noreferrer">Open GitHub Aster</a>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
