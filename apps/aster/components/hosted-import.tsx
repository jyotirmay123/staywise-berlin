"use client";

import { useEffect, useRef, useState } from 'react';
import type { PortfolioData } from '@/lib/domain';
import { localStore } from '@/lib/local-store';
import { exportPortfolio } from '@/lib/services';
import { SOURCE_ORIGIN } from '@/lib/hosted-transfer';
import { receivePortfolioTransfer } from '@/lib/receive-transfer';

export function HostedPortfolioImport({ currentData, onImport }: {
  currentData: PortfolioData;
  onImport: (data: PortfolioData) => Promise<void>;
}) {
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState<PortfolioData | null>(null);
  const [busy, setBusy] = useState(false);
  const sourceWindow = useRef<Window | null>(null);
  const nonce = useRef('');
  const expiry = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.data?.type !== 'aster-transfer-v1' || !nonce.current) return;
      try {
        const data = receivePortfolioTransfer(event, sourceWindow.current, nonce.current);
        if (!data) return;
        setPending(data);
        setStatus('Portfolio received privately. Review it below before importing.');
      } catch {
        setStatus('The source sent an invalid or mismatched portfolio. Nothing was changed. Try again or use JSON export/import.');
      }
    }
    window.addEventListener('message', receive);
    return () => {
      window.removeEventListener('message', receive);
      if (expiry.current) clearTimeout(expiry.current);
    };
  }, []);

  function start() {
    if (expiry.current) clearTimeout(expiry.current);
    nonce.current = Array.from(crypto.getRandomValues(new Uint8Array(32)), x => x.toString(16).padStart(2, '0')).join('');
    setPending(null);
    const url = new URL('/transfer', SOURCE_ORIGIN);
    url.searchParams.set('nonce', nonce.current);
    sourceWindow.current = window.open(url, `aster-transfer-${nonce.current}`, 'popup=yes,width=760,height=840');
    if (!sourceWindow.current) {
      nonce.current = '';
      setStatus('Your browser blocked the transfer window. Allow popups for this app, or open the original transfer page and download its JSON backup.');
      return;
    }
    setStatus('Sign in to your original Aster site in the opened window, then choose Send to GitHub Aster. No portfolio data is committed to GitHub.');
    expiry.current = setTimeout(() => {
      nonce.current = '';
      sourceWindow.current = null;
      setPending(null);
      setStatus('This transfer session expired after 15 minutes. Start again, or use the JSON backup option.');
    }, 15 * 60 * 1000);
  }

  async function accept() {
    if (!pending || busy) return;
    setBusy(true);
    try {
      await onImport(pending);
      sourceWindow.current?.postMessage({ type: 'aster-transfer-ack-v1', nonce: nonce.current }, SOURCE_ORIGIN);
      setPending(null);
      nonce.current = '';
      sourceWindow.current = null;
      if (expiry.current) clearTimeout(expiry.current);
      setStatus('Imported successfully and saved on this device. Export JSON to keep a separate backup. Future changes do not automatically sync between the two websites.');
    } catch {
      setStatus('The portfolio could not be saved in this browser. Your previous portfolio was kept. Check storage permissions or export a JSON backup.');
    } finally { setBusy(false); }
  }

  async function downloadPrevious() {
    try {
      const previous = await localStore.loadImportBackup();
      if (!previous) { setStatus('No previous portfolio backup is stored on this device.'); return; }
      exportPortfolio(previous);
    } catch { setStatus('The previous local backup could not be opened.'); }
  }

  return <section aria-label="Import original Aster portfolio" style={{ margin: '0 0 24px', padding: '20px', background: '#edf2e8', border: '1px solid #cbd7c4', borderRadius: '16px' }}>
    <h2 style={{ fontSize: '18px', margin: '0 0 8px' }}>Bring your existing portfolio</h2>
    <p style={{ margin: '0 0 14px', lineHeight: 1.6 }}>Read your signed-in ChatGPT Aster account and check for newer records on that browser. Import privately into this GitHub app; balances stay out of the public repository.</p>
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
      <button className="primary-button" onClick={start} disabled={busy}>Import from ChatGPT Aster</button>
      <a href={`${SOURCE_ORIGIN}/transfer`} target="_blank" rel="noopener noreferrer">Download from original site ↗</a>
      <button className="secondary-button" onClick={downloadPrevious} disabled={busy}>Download previous local backup</button>
    </div>
    {status && <p role="status" style={{ margin: '14px 0 0', lineHeight: 1.6 }}>{status}</p>}
    {pending && <div style={{ marginTop: '16px', padding: '16px', borderRadius: '10px', background: 'white' }}>
      <p style={{ margin: '0 0 10px' }}><strong>Incoming:</strong> {pending.investments.length} investments · {pending.valuations.length} valuations{pending.dataUpdatedAt ? ` · Last data change: ${new Date(pending.dataUpdatedAt).toLocaleString()}` : ''}.</p>
      <p style={{ margin: '0 0 12px' }}>This replaces the {currentData.investments.length} investments and {currentData.valuations.length} valuations currently on this device. A previous local portfolio is backed up before replacement.</p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button className="primary-button" onClick={accept} disabled={busy}>{busy ? 'Saving…' : 'Import this portfolio'}</button>
        <button className="secondary-button" disabled={busy} onClick={() => { setPending(null); nonce.current = ''; setStatus('Import cancelled. Your portfolio was not changed.'); }}>Cancel</button>
      </div>
    </div>}
  </section>;
}
