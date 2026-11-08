"use client";

import {
  ArrowDownToLine,
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronRight,
  Cloud,
  CloudOff,
  Download,
  Gauge,
  History,
  Landmark,
  LayoutDashboard,
  Maximize2,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  EMPTY_PORTFOLIO,
  type Currency,
  type Investment,
  type PortfolioData,
  type Valuation,
  type VaultCredentials,
  amountInCurrency,
  formatMoney,
  investmentGrowth,
  investmentTimeline,
  latestValuation,
  normalizePortfolioData,
  portfolioTimeline,
  portfolioValue,
  projectedValue,
} from "@/lib/domain";
import { localStore } from "@/lib/local-store";
import { parsePortfolioExport } from "@/lib/portable-data";
import {
  type AccountSyncState,
  createAccountPortfolio,
  createVault,
  exportPortfolio,
  fetchEurInrRate,
  pullAccountPortfolio,
  pullVault,
  pushAccountPortfolio,
  pushVault,
} from "@/lib/services";

type Tab = "overview" | "investments" | "history" | "forecast" | "settings";
type Modal = "investment" | "valuation" | "analysis" | null;
type ChartRange = "1M" | "3M" | "6M" | "1Y" | "2Y" | "3Y" | "ALL";

const CHART_RANGES: Array<{ value: ChartRange; label: string; months: number }> = [
  { value: "1M", label: "1M", months: 1 },
  { value: "3M", label: "3M", months: 3 },
  { value: "6M", label: "6M", months: 6 },
  { value: "1Y", label: "1Y", months: 12 },
  { value: "2Y", label: "2Y", months: 24 },
  { value: "3Y", label: "3Y", months: 36 },
  { value: "ALL", label: "All", months: 0 },
];

const NAVIGATION: Array<{ id: Tab; label: string; icon: typeof Gauge }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "investments", label: "Investments", icon: WalletCards },
  { id: "history", label: "History", icon: History },
  { id: "forecast", label: "Forecast", icon: Target },
  { id: "settings", label: "Settings", icon: Settings },
];

const CATEGORY_COLORS = ["#dbe86f", "#f0a67b", "#89b9ad", "#d9b4e8", "#9db5e5"];
const HORIZONS = [1, 2, 3, 5, 10];

function uid(): string {
  return crypto.randomUUID();
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function shortDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function classNames(...values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function filterTimeline(
  points: Array<{ date: string; value: number }>,
  range: ChartRange,
): Array<{ date: string; value: number }> {
  if (range === "ALL" || !points.length) return points;
  const months = CHART_RANGES.find((item) => item.value === range)?.months ?? 0;
  const latest = new Date(`${points.at(-1)!.date}T00:00:00Z`);
  latest.setUTCMonth(latest.getUTCMonth() - months);
  const cutoff = latest.toISOString().slice(0, 10);
  const filtered = points.filter((point) => point.date >= cutoff);
  return filtered.length ? filtered : points.slice(-1);
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

function ValueChart({
  points,
  currency,
  compact = false,
  interactive = false,
  onExpand,
}: {
  points: Array<{ date: string; value: number }>;
  currency: Currency;
  compact?: boolean;
  interactive?: boolean;
  onExpand?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length < 2) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    context.scale(ratio, ratio);

    const width = rect.width;
    const height = rect.height;
    const padding = 12;
    const values = points.map((point) => point.value);
    const min = Math.min(...values) * 0.96;
    const max = Math.max(...values) * 1.04;
    const range = max - min || 1;
    const coords = points.map((point, index) => ({
      x: padding + (index / (points.length - 1)) * (width - padding * 2),
      y: height - padding - ((point.value - min) / range) * (height - padding * 2),
    }));

    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(
      0,
      compact ? "rgba(39, 66, 57, 0.18)" : "rgba(219, 232, 111, 0.38)",
    );
    gradient.addColorStop(
      1,
      compact ? "rgba(39, 66, 57, 0)" : "rgba(219, 232, 111, 0)",
    );

    context.beginPath();
    context.moveTo(coords[0].x, height);
    coords.forEach((point) => context.lineTo(point.x, point.y));
    context.lineTo(coords.at(-1)!.x, height);
    context.closePath();
    context.fillStyle = gradient;
    context.fill();

    context.beginPath();
    coords.forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.strokeStyle = compact ? "#274239" : "#dbe86f";
    context.lineWidth = compact ? 2 : 3;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.stroke();

    if (hoverIndex !== null && coords[hoverIndex]) {
      const selected = coords[hoverIndex];
      context.beginPath();
      context.moveTo(selected.x, padding);
      context.lineTo(selected.x, height - padding);
      context.strokeStyle = compact
        ? "rgba(39, 66, 57, 0.24)"
        : "rgba(255, 255, 255, 0.28)";
      context.lineWidth = 1;
      context.stroke();
      context.beginPath();
      context.arc(selected.x, selected.y, compact ? 3 : 5, 0, Math.PI * 2);
      context.fillStyle = compact ? "#274239" : "#dbe86f";
      context.fill();
      context.strokeStyle = compact ? "#fffdf8" : "#10261f";
      context.lineWidth = 2;
      context.stroke();
    }
  }, [points, currency, compact, hoverIndex]);

  if (points.length < 2) {
    return (
      <div className={classNames("chart-empty", compact && "compact")}>
        <BarChart3 size={22} />
        <span>{compact ? "Add another value for trend" : "Add two valuations to reveal growth curve."}</span>
      </div>
    );
  }
  const selected = hoverIndex === null ? null : points[hoverIndex];
  const previous =
    hoverIndex !== null && hoverIndex > 0 ? points[hoverIndex - 1] : null;
  const pointChange = selected && previous ? selected.value - previous.value : null;

  return (
    <div
      className={classNames(
        "chart-canvas-frame",
        onExpand && "clickable",
      )}
      onPointerMove={(event) => {
        if (!interactive || points.length < 2) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = Math.max(
          0,
          Math.min(1, (event.clientX - rect.left) / rect.width),
        );
        setHoverIndex(Math.round(ratio * (points.length - 1)));
      }}
      onPointerLeave={() => setHoverIndex(null)}
      onClick={onExpand}
      onKeyDown={(event) => {
        if (!onExpand || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        onExpand();
      }}
      role={onExpand ? "button" : undefined}
      tabIndex={onExpand ? 0 : undefined}
      aria-label={onExpand ? "Open expanded portfolio chart" : undefined}
    >
      <canvas className="value-chart" ref={canvasRef} />
      {selected && interactive && (
        <div
          className="chart-tooltip"
          style={{
            left: `${10 + (hoverIndex! / (points.length - 1)) * 80}%`,
          }}
        >
          <small>{shortDate(selected.date)}</small>
          <b>{formatMoney(selected.value, currency)}</b>
          {pointChange !== null && (
            <span className={pointChange < 0 ? "negative" : ""}>
              {pointChange >= 0 ? "+" : ""}
              {formatMoney(pointChange, currency)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ChartRangePicker({
  value,
  onChange,
  compact = false,
}: {
  value: ChartRange;
  onChange: (value: ChartRange) => void;
  compact?: boolean;
}) {
  const options = compact
    ? CHART_RANGES.filter((item) =>
        ["1M", "6M", "1Y", "3Y", "ALL"].includes(item.value),
      )
    : CHART_RANGES;
  return (
    <div className="chart-range-picker" aria-label="Chart period">
      {options.map((item) => (
        <button
          key={item.value}
          className={value === item.value ? "active" : ""}
          onClick={() => onChange(item.value)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  eyebrow = "Portfolio entry",
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  eyebrow?: string;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={classNames("modal-card", wide && "wide")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close">
          <X size={19} />
        </button>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="modal-subtitle">{subtitle}</p>
        {children}
      </section>
    </div>
  );
}

export function PortfolioApp({ localOnly = false, appBase = "/" }: { localOnly?: boolean; appBase?: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [data, setData] = useState<PortfolioData>(EMPTY_PORTFOLIO);
  const [credentials, setCredentials] = useState<VaultCredentials | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [mobileMenu, setMobileMenu] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [editingInvestmentId, setEditingInvestmentId] = useState("");
  const [editingValuationId, setEditingValuationId] = useState("");
  const [selectedInvestment, setSelectedInvestment] = useState("");
  const [chartRange, setChartRange] = useState<ChartRange>("ALL");
  const [valuationAmount, setValuationAmount] = useState("");
  const [valuationCurrency, setValuationCurrency] = useState<Currency>("EUR");
  const [valuationDate, setValuationDate] = useState(today());
  const [valuationRate, setValuationRate] = useState("");
  const [valuationNote, setValuationNote] = useState("");
  const [horizon, setHorizon] = useState(5);
  const [toast, setToast] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [accountSync, setAccountSync] = useState<AccountSyncState | null>(null);
  const [accountSyncError, setAccountSyncError] = useState("");
  const [syncCodeInput, setSyncCodeInput] = useState("");
  const credentialsRef = useRef<VaultCredentials | null>(null);
  const accountSyncRef = useRef<AccountSyncState | null>(null);
  const dataRef = useRef<PortfolioData>(EMPTY_PORTFOLIO);
  const syncQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    credentialsRef.current = credentials;
  }, [credentials]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const saveFxFromEffect = useEffectEvent((rate: number, date: string) => {
    saveData({
      ...dataRef.current,
      lastFxRate: rate,
      lastFxDate: date,
    });
  });

  useEffect(() => {
    Promise.all([localStore.loadPortfolio(), localStore.loadCredentials()])
      .then(([savedData, savedCredentials]) => {
        if (savedData) {
          const normalized = normalizePortfolioData(savedData);
          dataRef.current = normalized;
          setData(normalized);
        }
        if (savedCredentials && !localOnly) setCredentials(savedCredentials);
      })
      .catch(() => setToast("Local data could not be loaded. Export backups regularly."))
      .finally(() => setLoaded(true));

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    navigator.serviceWorker?.register(`${appBase}sw.js`, { scope: appBase }).catch(() => undefined);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [localOnly, appBase]);

  useEffect(() => {
    if (localOnly || !loaded || !online) return;
    let cancelled = false;

    async function reconcileAccount(): Promise<void> {
      setSyncing(true);
      setAccountSyncError("");
      try {
        let remote = await pullAccountPortfolio();
        const local = dataRef.current;

        if (!remote) {
          try {
            const state = await createAccountPortfolio(local);
            if (cancelled) return;
            accountSyncRef.current = state;
            setAccountSync(state);
            return;
          } catch {
            remote = await pullAccountPortfolio();
          }
        }
        if (!remote || cancelled) return;

        const localHasData =
          local.investments.length > 0 || local.valuations.length > 0;
        const remoteHasData =
          remote.data.investments.length > 0 || remote.data.valuations.length > 0;
        const localIsNewer =
          local.dataUpdatedAt > (remote.data.dataUpdatedAt ?? "") ||
          (localHasData && !remoteHasData);

        if (localIsNewer) {
          const state = await pushAccountPortfolio(local, remote.state);
          if (cancelled) return;
          accountSyncRef.current = state;
          setAccountSync(state);
        } else {
          const normalized = normalizePortfolioData(remote.data);
          dataRef.current = normalized;
          setData(normalized);
          await localStore.savePortfolio(normalized);
          if (cancelled) return;
          accountSyncRef.current = remote.state;
          setAccountSync(remote.state);
        }
      } catch (error) {
        if (cancelled) return;
        setAccountSyncError(
          error instanceof Error ? error.message : "Account cloud unavailable.",
        );
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    reconcileAccount();
    return () => {
      cancelled = true;
    };
  }, [loaded, online, localOnly]);

  useEffect(() => {
    if (!loaded || data.lastFxRate > 0 || !online || (!localOnly && !accountSync)) return;
    fetchEurInrRate()
      .then((fx) => {
        saveFxFromEffect(fx.rate, fx.date);
        setToast(`EUR/INR fixed at ${fx.rate.toFixed(2)} for new entries.`);
      })
      .catch(() => setToast("Live FX unavailable. Enter rate manually."));
  }, [loaded, online, data.lastFxRate, accountSync, localOnly]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const timeline = useMemo(
    () => portfolioTimeline(data, currency),
    [data, currency],
  );
  const visibleTimeline = useMemo(
    () => filterTimeline(timeline, chartRange),
    [timeline, chartRange],
  );
  const total = useMemo(
    () => portfolioValue(data, currency),
    [data, currency],
  );
  const initialValue = visibleTimeline[0]?.value ?? 0;
  const periodValue = visibleTimeline.at(-1)?.value ?? 0;
  const gain = periodValue - initialValue;
  const gainPercent = initialValue > 0 ? (gain / initialValue) * 100 : 0;
  const rangeLabel = chartRange === "ALL" ? "all time" : `over ${chartRange}`;
  const forecast = projectedValue(data, horizon, currency);

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    data.investments.forEach((investment) => {
      const latest = latestValuation(data, investment.id);
      if (!latest) return;
      const value = amountInCurrency(
        latest.amount,
        latest.currency,
        currency,
        data.lastFxRate || latest.eurInrRate,
      );
      totals.set(investment.category, (totals.get(investment.category) ?? 0) + value);
    });
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [data, currency]);

  function notify(message: string): void {
    setToast(message);
  }

  function queueCloudPush(nextData: PortfolioData): void {
    if (localOnly || !online) return;
    syncQueueRef.current = syncQueueRef.current.then(async () => {
      setSyncing(true);
      try {
        const currentAccountState = accountSyncRef.current;
        if (currentAccountState) {
          try {
            const updatedAccount = await pushAccountPortfolio(
              nextData,
              currentAccountState,
            );
            accountSyncRef.current = updatedAccount;
            setAccountSync(updatedAccount);
            setAccountSyncError("");
          } catch {
            const remote = await pullAccountPortfolio();
            if (!remote) throw new Error("Account cloud portfolio disappeared.");
            if (
              nextData.dataUpdatedAt > (remote.data.dataUpdatedAt ?? "")
            ) {
              const updatedAccount = await pushAccountPortfolio(
                nextData,
                remote.state,
              );
              accountSyncRef.current = updatedAccount;
              setAccountSync(updatedAccount);
            } else {
              const normalized = normalizePortfolioData(remote.data);
              dataRef.current = normalized;
              setData(normalized);
              await localStore.savePortfolio(normalized);
              accountSyncRef.current = remote.state;
              setAccountSync(remote.state);
            }
          }
        }

        const currentCredentials = credentialsRef.current;
        if (currentCredentials) {
          const updated = await pushVault(nextData, currentCredentials);
          credentialsRef.current = updated;
          setCredentials(updated);
          await localStore.saveCredentials(updated);
        }
      } catch (error) {
        notify(error instanceof Error ? error.message : "Cloud sync failed.");
        setAccountSyncError(
          error instanceof Error ? error.message : "Account cloud sync failed.",
        );
      } finally {
        setSyncing(false);
      }
    });
  }

  function saveData(nextData: PortfolioData, message?: string): void {
    const timestamped = {
      ...normalizePortfolioData(nextData),
      dataUpdatedAt: new Date().toISOString(),
    };
    dataRef.current = timestamped;
    setData(timestamped);
    localStore
      .savePortfolio(timestamped)
      .catch(() => notify("Local save failed."));
    queueCloudPush(timestamped);
    if (message) notify(message);
  }

  async function refreshFx(): Promise<void> {
    try {
      const fx = await fetchEurInrRate();
      saveData({ ...data, lastFxRate: fx.rate, lastFxDate: fx.date });
      notify(`EUR/INR fixed at ${fx.rate.toFixed(2)} for new entries.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "FX refresh failed.");
    }
  }

  function openInvestment(investment?: Investment): void {
    setEditingInvestmentId(investment?.id ?? "");
    setModal("investment");
  }

  function setValuationDefaults(
    investmentId: string,
    valuation?: Valuation,
  ): void {
    const latest = latestValuation(data, investmentId);
    setSelectedInvestment(investmentId);
    setValuationAmount(
      String(valuation?.amount ?? latest?.amount ?? ""),
    );
    setValuationCurrency(
      valuation?.currency ??
        latest?.currency ??
        data.investments.find((item) => item.id === investmentId)?.currency ??
        "EUR",
    );
    setValuationDate(valuation?.valuedAt ?? today());
    setValuationRate(
      String(
        valuation?.eurInrRate ||
          data.lastFxRate ||
          latest?.eurInrRate ||
          100,
      ),
    );
    setValuationNote(valuation?.note ?? "");
  }

  function openValuation(
    investmentId?: string,
    valuation?: Valuation,
  ): void {
    const resolvedInvestmentId =
      investmentId ?? valuation?.investmentId ?? data.investments[0]?.id ?? "";
    setEditingValuationId(valuation?.id ?? "");
    setValuationDefaults(resolvedInvestmentId, valuation);
    setModal("valuation");
  }

  function saveInvestment(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const existing = data.investments.find(
      (item) => item.id === editingInvestmentId,
    );
    const now = new Date().toISOString();
    const investment: Investment = {
      id: existing?.id ?? uid(),
      name: String(form.get("name")).trim(),
      category: String(form.get("category")).trim(),
      currency: String(form.get("currency")) as Currency,
      expectedAnnualReturn: Number(form.get("return")),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (!investment.name || !investment.category) return;
    saveData(
      {
        ...data,
        investments: existing
          ? data.investments.map((item) =>
              item.id === existing.id ? investment : item,
            )
          : [...data.investments, investment],
      },
      existing
        ? `${investment.name} details updated.`
        : `${investment.name} added.`,
    );
    setModal(null);
  }

  function saveValuation(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const investment = data.investments.find(
      (item) => item.id === String(form.get("investment")),
    );
    if (!investment) return;
    const rate = Number(form.get("rate"));
    const amount = Number(form.get("amount"));
    if (amount < 0 || rate <= 0) return;
    const valuedAt = String(form.get("date"));
    const now = new Date().toISOString();
    const existing =
      data.valuations.find((item) => item.id === editingValuationId) ??
      data.valuations.find(
        (item) =>
          item.investmentId === investment.id && item.valuedAt === valuedAt,
      );
    const valuation: Valuation = {
      id: existing?.id ?? uid(),
      investmentId: investment.id,
      amount,
      currency: String(form.get("currency")) as Currency,
      eurInrRate: rate,
      valuedAt,
      note: String(form.get("note")).trim(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    saveData(
      {
        ...data,
        lastFxRate: rate,
        lastFxDate: valuedAt,
        valuations: existing
          ? data.valuations.map((item) =>
              item.id === existing.id ? valuation : item,
            )
          : [...data.valuations, valuation],
      },
      existing
        ? `Snapshot updated with EUR/INR ${rate.toFixed(2)}.`
        : `Snapshot saved with EUR/INR ${rate.toFixed(2)}.`,
    );
    setModal(null);
  }

  function deleteInvestment(investment: Investment): void {
    if (!window.confirm(`Delete ${investment.name} and all its valuation history?`)) {
      return;
    }
    saveData(
      {
        ...data,
        investments: data.investments.filter((item) => item.id !== investment.id),
        valuations: data.valuations.filter(
          (item) => item.investmentId !== investment.id,
        ),
      },
      `${investment.name} deleted.`,
    );
  }

  function deleteValuation(valuation: Valuation): void {
    const investment = data.investments.find(
      (item) => item.id === valuation.investmentId,
    );
    if (
      !window.confirm(
        `Delete ${shortDate(valuation.valuedAt)} snapshot for ${investment?.name ?? "this investment"}?`,
      )
    ) {
      return;
    }
    saveData(
      {
        ...data,
        valuations: data.valuations.filter((item) => item.id !== valuation.id),
      },
      "Snapshot deleted. Timeline recalculated.",
    );
  }

  async function enableCloudSync(): Promise<void> {
    setSyncing(true);
    try {
      const created = await createVault(data);
      setCredentials(created);
      credentialsRef.current = created;
      await localStore.saveCredentials(created);
      notify("Key-protected cloud vault created.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Vault creation failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function importCloudVault(): Promise<void> {
    const [vaultId, vaultKey] = syncCodeInput.trim().split(".");
    if (!vaultId || !vaultKey) {
      notify("Sync code format invalid.");
      return;
    }
    setSyncing(true);
    try {
      const result = await pullVault(vaultId, vaultKey);
      setData(result.data);
      setCredentials(result.credentials);
      credentialsRef.current = result.credentials;
      await Promise.all([
        localStore.savePortfolio(result.data),
        localStore.saveCredentials(result.credentials),
      ]);
      notify("Cloud portfolio restored.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Cloud restore failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function pullLatest(): Promise<void> {
    if (!credentials) return;
    setSyncing(true);
    try {
      const result = await pullVault(credentials.vaultId, credentials.vaultKey);
      setData(result.data);
      setCredentials(result.credentials);
      credentialsRef.current = result.credentials;
      await Promise.all([
        localStore.savePortfolio(result.data),
        localStore.saveCredentials(result.credentials),
      ]);
      notify("Latest cloud data loaded.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Cloud pull failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function copySyncCode(): Promise<void> {
    if (!credentials) return;
    await navigator.clipboard.writeText(
      `${credentials.vaultId}.${credentials.vaultKey}`,
    );
    notify("Sync code copied. Store it securely.");
  }

  function importFile(file: File | undefined): void {
    if (!file) return;
    file
      .text()
      .then(parsePortfolioExport)
      .then((nextData) => {
        if (!window.confirm("Import replaces this browser’s portfolio. Export a backup first if needed. Continue?")) return;
        saveData(nextData, "Portfolio imported.");
      })
      .catch((error: unknown) =>
        notify(error instanceof Error ? error.message : "Import failed."),
      );
  }

  function renderOverview() {
    return (
      <>
        <header className="page-heading">
          <div>
            <p className="eyebrow">Portfolio overview</p>
            <h1>Your wealth, in perspective.</h1>
            <p>Track real progress across currencies—without losing yesterday’s truth.</p>
          </div>
          <button
            className="primary-button desktop-action"
            onClick={() =>
              data.investments.length ? openValuation() : openInvestment()
            }
          >
            <Plus size={17} />
            {data.investments.length ? "Update value" : "Add investment"}
          </button>
        </header>

        <section className="hero-grid">
          <article className="total-card">
            <div className="card-topline">
              <span>Total portfolio</span>
              <div className="card-controls">
                <button className="fx-button" onClick={refreshFx} disabled={!online}>
                  <RefreshCw size={12} /> FX
                </button>
                <button
                  className="expand-chart-button"
                  onClick={() => setModal("analysis")}
                  aria-label="Expand portfolio chart"
                >
                  <Maximize2 size={14} />
                </button>
                <CurrencyToggle value={currency} onChange={setCurrency} />
              </div>
            </div>
            <strong>{formatMoney(total, currency)}</strong>
            <div className={classNames("performance-pill", gain < 0 && "negative")}>
              <TrendingUp size={15} />
              {gainPercent >= 0 ? "+" : ""}
              {gainPercent.toFixed(1)}%
              <span>
                {formatMoney(gain, currency)} {rangeLabel}
              </span>
            </div>
            <ChartRangePicker
              value={chartRange}
              onChange={setChartRange}
              compact
            />
            <div className="chart-wrap">
              <ValueChart
                points={visibleTimeline}
                currency={currency}
                interactive
                onExpand={() => setModal("analysis")}
              />
            </div>
            <div className="chart-dates">
              <span>
                {visibleTimeline[0]
                  ? shortDate(visibleTimeline[0].date)
                  : "First entry"}
              </span>
              <span>
                {visibleTimeline.at(-1)
                  ? shortDate(visibleTimeline.at(-1)!.date)
                  : "Today"}
              </span>
            </div>
          </article>

          <article className="forecast-card">
            <div className="card-icon">
              <ArrowUpRight size={20} />
            </div>
            <p>Projected in {horizon} years</p>
            <strong>{formatMoney(forecast, currency)}</strong>
            <span>
              {formatMoney(Math.max(0, forecast - total), currency)} potential growth
            </span>
            <button className="text-button" onClick={() => setActiveTab("forecast")}>
              Explore forecast <ChevronRight size={16} />
            </button>
          </article>
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Allocation</p>
                <h2>Investment mix</h2>
              </div>
              <button className="text-button" onClick={() => setActiveTab("investments")}>
                View all <ChevronRight size={15} />
              </button>
            </div>
            {categoryTotals.length ? (
              <>
                <div className="allocation-bar" aria-label="Portfolio allocation">
                  {categoryTotals.map(([category, value], index) => (
                    <i
                      key={category}
                      style={{
                        width: `${(value / total) * 100}%`,
                        background: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                      }}
                    />
                  ))}
                </div>
                <div className="allocation-list">
                  {categoryTotals.map(([category, value], index) => (
                    <div key={category}>
                      <span>
                        <i
                          style={{
                            background: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                          }}
                        />
                        {category}
                      </span>
                      <b>{formatMoney(value, currency)}</b>
                      <small>{total ? ((value / total) * 100).toFixed(0) : 0}%</small>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={<WalletCards size={22} />}
                title="No allocation yet"
                copy="Create your first investment horizon to see its share."
                action="Add investment"
                onAction={() => openInvestment()}
              />
            )}
          </article>

          <article className="panel activity-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Recent</p>
                <h2>Latest updates</h2>
              </div>
            </div>
            {data.valuations.length ? (
              <div className="activity-list">
                {[...data.valuations]
                  .sort((a, b) => b.valuedAt.localeCompare(a.valuedAt))
                  .slice(0, 4)
                  .map((valuation) => {
                    const investment = data.investments.find(
                      (item) => item.id === valuation.investmentId,
                    );
                    return (
                      <div key={valuation.id}>
                        <span className="activity-icon">
                          <Landmark size={17} />
                        </span>
                        <span>
                          <b>{investment?.name ?? "Removed investment"}</b>
                          <small>{shortDate(valuation.valuedAt)}</small>
                        </span>
                        <strong>
                          {formatMoney(valuation.amount, valuation.currency)}
                        </strong>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <EmptyState
                icon={<History size={22} />}
                title="History begins with one value"
                copy="Every update preserves its own date and FX rate."
              />
            )}
          </article>
        </section>
      </>
    );
  }

  function renderInvestments() {
    return (
      <>
        <header className="page-heading compact-heading">
          <div>
            <p className="eyebrow">Portfolio structure</p>
            <h1>Investments</h1>
            <p>Flexible horizons, categories, currencies, and return assumptions.</p>
          </div>
          <button className="primary-button" onClick={() => openInvestment()}>
            <Plus size={17} /> New investment
          </button>
        </header>
        <section className="investment-grid">
          {data.investments.map((investment, index) => {
            const latest = latestValuation(data, investment.id);
            const growth = investmentGrowth(data, investment.id);
            const trend = investmentTimeline(data, investment.id, currency);
            const snapshotCount = data.valuations.filter(
              (item) => item.investmentId === investment.id,
            ).length;
            return (
              <article className="investment-card" key={investment.id}>
                <div className="investment-card-top">
                  <span
                    className="investment-badge"
                    style={{
                      background: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                    }}
                  >
                    {investment.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="card-actions">
                    <button
                      className="icon-button"
                      onClick={() => openInvestment(investment)}
                      aria-label={`Edit ${investment.name}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button danger"
                      onClick={() => deleteInvestment(investment)}
                      aria-label={`Delete ${investment.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <small>{investment.category}</small>
                <h2>{investment.name}</h2>
                <strong>
                  {latest
                    ? formatMoney(latest.amount, latest.currency)
                    : "No value yet"}
                </strong>
                <small className="latest-date">
                  {latest
                    ? `Last updated ${shortDate(latest.valuedAt)}`
                    : "Awaiting first snapshot"}
                </small>
                <div className="mini-chart">
                  <ValueChart
                    points={trend}
                    currency={currency}
                    compact
                  />
                </div>
                <div className="investment-meta">
                  <span>
                    Expected return <b>{investment.expectedAnnualReturn}% p.a.</b>
                  </span>
                  <span>
                    Growth{" "}
                    <b>
                      {growth === null
                        ? "—"
                        : `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`}
                    </b>
                  </span>
                  <span>
                    History <b>{snapshotCount} snapshots</b>
                  </span>
                </div>
                <div className="investment-card-buttons">
                  <button
                    className="primary-button"
                    onClick={() => openValuation(investment.id)}
                  >
                    Update value
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => openInvestment(investment)}
                  >
                    Edit details
                  </button>
                </div>
              </article>
            );
          })}
          {!data.investments.length && (
            <div className="wide-empty">
              <EmptyState
                icon={<WalletCards size={24} />}
                title="Build your portfolio map"
                copy="Add stocks, funds, deposits, property, pensions—or any custom type."
                action="Create first investment"
                onAction={() => openInvestment()}
              />
            </div>
          )}
        </section>
      </>
    );
  }

  function renderHistory() {
    const sorted = [...data.valuations].sort(
      (a, b) =>
        b.valuedAt.localeCompare(a.valuedAt) ||
        (b.updatedAt ?? b.createdAt).localeCompare(
          a.updatedAt ?? a.createdAt,
        ),
    );
    return (
      <>
        <header className="page-heading compact-heading">
          <div>
            <p className="eyebrow">Immutable context</p>
            <h1>Valuation history</h1>
            <p>Original amount and date-specific FX rate stay together.</p>
          </div>
          <button
            className="primary-button"
            onClick={() =>
              data.investments.length ? openValuation() : openInvestment()
            }
          >
            <Plus size={17} /> Add valuation
          </button>
        </header>
        <section className="panel history-table-panel">
          <div className="history-table">
            <div className="history-row history-head">
              <span>Date</span>
              <span>Investment</span>
              <span>Original value</span>
              <span>EUR/INR stored</span>
              <span>Historical EUR</span>
              <span>Historical INR</span>
              <span>Actions</span>
            </div>
            {sorted.map((valuation) => {
              const investment = data.investments.find(
                (item) => item.id === valuation.investmentId,
              );
              return (
                <div className="history-row" key={valuation.id}>
                  <span data-label="Date">{shortDate(valuation.valuedAt)}</span>
                  <span data-label="Investment">
                    <b>{investment?.name ?? "Removed investment"}</b>
                    <small>{valuation.note || investment?.category}</small>
                  </span>
                  <span data-label="Original value">
                    {formatMoney(valuation.amount, valuation.currency)}
                  </span>
                  <span data-label="EUR/INR">{valuation.eurInrRate.toFixed(4)}</span>
                  <span data-label="Historical EUR">
                    {formatMoney(
                      amountInCurrency(
                        valuation.amount,
                        valuation.currency,
                        "EUR",
                        valuation.eurInrRate,
                      ),
                      "EUR",
                    )}
                  </span>
                  <span data-label="Historical INR">
                    {formatMoney(
                      amountInCurrency(
                        valuation.amount,
                        valuation.currency,
                        "INR",
                        valuation.eurInrRate,
                      ),
                      "INR",
                    )}
                  </span>
                  <span className="history-actions" data-label="Actions">
                    <button
                      className="icon-button"
                      onClick={() =>
                        openValuation(valuation.investmentId, valuation)
                      }
                      aria-label={`Edit ${shortDate(valuation.valuedAt)} snapshot`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="icon-button danger"
                      onClick={() => deleteValuation(valuation)}
                      aria-label={`Delete ${shortDate(valuation.valuedAt)} snapshot`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
          {!sorted.length && (
            <EmptyState
              icon={<History size={24} />}
              title="No valuations recorded"
              copy="Each manual update becomes one auditable historical point."
            />
          )}
        </section>
      </>
    );
  }

  function renderForecast() {
    const conservative = data.investments.reduce((sum, investment) => {
      const latest = latestValuation(data, investment.id);
      if (!latest) return sum;
      const value = amountInCurrency(
        latest.amount,
        latest.currency,
        currency,
        data.lastFxRate || latest.eurInrRate,
      );
      return (
        sum +
        value *
          Math.pow(
            1 + Math.max(0, investment.expectedAnnualReturn - 2) / 100,
            horizon,
          )
      );
    }, 0);
    const optimistic = data.investments.reduce((sum, investment) => {
      const latest = latestValuation(data, investment.id);
      if (!latest) return sum;
      const value = amountInCurrency(
        latest.amount,
        latest.currency,
        currency,
        data.lastFxRate || latest.eurInrRate,
      );
      return (
        sum +
        value *
          Math.pow(1 + (investment.expectedAnnualReturn + 2) / 100, horizon)
      );
    }, 0);

    return (
      <>
        <header className="page-heading compact-heading">
          <div>
            <p className="eyebrow">Scenario planning</p>
            <h1>Future outlook</h1>
            <p>Compound current values using assumptions you control.</p>
          </div>
          <CurrencyToggle value={currency} onChange={setCurrency} />
        </header>
        <section className="forecast-hero panel">
          <div>
            <p className="eyebrow">Selected horizon</p>
            <h2>{horizon} years from now</h2>
            <div className="horizon-picker">
              {HORIZONS.map((value) => (
                <button
                  key={value}
                  className={value === horizon ? "active" : ""}
                  onClick={() => setHorizon(value)}
                >
                  {value}Y
                </button>
              ))}
            </div>
          </div>
          <div className="projection-main">
            <small>Expected portfolio value</small>
            <strong>{formatMoney(forecast, currency)}</strong>
            <span>
              +{formatMoney(Math.max(0, forecast - total), currency)} versus today
            </span>
          </div>
        </section>
        <section className="scenario-grid">
          {[
            ["Conservative", conservative, "Expected returns −2%"],
            ["Expected", forecast, "Your per-investment assumptions"],
            ["Optimistic", optimistic, "Expected returns +2%"],
          ].map(([label, value, note], index) => (
            <article className="scenario-card" key={String(label)}>
              <span className={`scenario-line line-${index}`} />
              <small>{String(label)}</small>
              <strong>{formatMoney(Number(value), currency)}</strong>
              <p>{String(note)}</p>
            </article>
          ))}
        </section>
        <p className="forecast-disclaimer">
          Forecasts show mathematical scenarios, not financial advice. Contributions,
          taxes, inflation, fees, and future FX movement are excluded.
        </p>
      </>
    );
  }

  function renderSettings() {
    const syncCode = credentials
      ? `${credentials.vaultId}.${credentials.vaultKey}`
      : "";
    return (
      <>
        <header className="page-heading compact-heading">
          <div>
            <p className="eyebrow">Data ownership</p>
            <h1>Settings & sync</h1>
            <p>{localOnly ? "Saved in this browser. Export JSON to back up or move your portfolio." : "Local-first cache with automatic signed-in account sync."}</p>
          </div>
        </header>
        <section className="settings-grid">
          <article className="panel setting-card">
            <div className="setting-icon">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2>Local cache</h2>
              <p>
                Portfolio lives in device IndexedDB. Works offline and survives app
                restarts.
              </p>
              <span className="status-chip healthy">
                <Check size={14} /> Active
              </span>
            </div>
          </article>
          {localOnly ? (
            <article className="panel setting-card cloud-setting">
              <div className="setting-icon"><CloudOff size={22} /></div>
              <div>
                <h2>Local-only edition</h2>
                <p>GitHub Pages does not provide account sign-in or cloud vault sync. Your portfolio is saved only in this browser. Use JSON export and import to transfer it between devices or the original hosted edition.</p>
                <p>Clearing browser data removes local records. Keep a JSON backup in a safe location.</p>
              </div>
            </article>
          ) : <>
          <article className="panel setting-card cloud-setting">
            <div className="setting-icon">
              <Cloud size={22} />
            </div>
            <div>
              <h2>Signed-in cloud</h2>
              <p>
                Same ChatGPT account shares one portfolio across website and
                Android. Every online edit uploads automatically.
              </p>
              {accountSync ? (
                <span className="status-chip healthy">
                  <Check size={14} /> Synced{" "}
                  {new Date(accountSync.updatedAt).toLocaleString()}
                </span>
              ) : accountSyncError ? (
                <span className="status-chip">
                  <CloudOff size={14} /> {accountSyncError}
                </span>
              ) : (
                <span className="status-chip">
                  <RefreshCw size={14} /> Connecting…
                </span>
              )}
              <h3>Recovery-key backup</h3>
              {credentials ? (
                <>
                  <p>
                    Optional second vault synced{" "}
                    {credentials.updatedAt
                      ? new Date(credentials.updatedAt).toLocaleString()
                      : "now"}.
                  </p>
                  <label className="sync-code">
                    Recovery sync code
                    <span>{syncCode.replace(credentials.vaultKey, "••••••••••••••••")}</span>
                  </label>
                  <div className="button-row">
                    <button className="secondary-button" onClick={copySyncCode}>
                      Copy full code
                    </button>
                    <button
                      className="secondary-button"
                      onClick={pullLatest}
                      disabled={syncing}
                    >
                      <RefreshCw size={15} /> Pull latest
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    Optional portable backup independent from account login.
                  </p>
                  <button
                    className="primary-button"
                    onClick={enableCloudSync}
                    disabled={syncing || !online}
                  >
                    <Cloud size={16} /> Enable recovery vault
                  </button>
                </>
              )}
            </div>
          </article>
          <article className="panel setting-card">
            <div className="setting-icon">
              <RefreshCw size={22} />
            </div>
            <div>
              <h2>Restore another device</h2>
              <p>Paste full recovery sync code from your first device.</p>
              <div className="restore-row">
                <input
                  value={syncCodeInput}
                  onChange={(event) => setSyncCodeInput(event.target.value)}
                  placeholder="vault-id.secret-key"
                  aria-label="Recovery sync code"
                />
                <button
                  className="secondary-button"
                  onClick={importCloudVault}
                  disabled={syncing}
                >
                  Restore
                </button>
              </div>
            </div>
          </article>
          </>}
          <article className="panel setting-card">
            <div className="setting-icon">
              <Download size={22} />
            </div>
            <div>
              <h2>Portable backup</h2>
              <p>Export readable JSON anytime. Import works without cloud access.</p>
              <div className="button-row">
                <button
                  className="secondary-button"
                  onClick={() => exportPortfolio(data)}
                >
                  <ArrowDownToLine size={15} /> Export
                </button>
                <label className="secondary-button file-button">
                  <ArrowUpRight size={15} /> Import
                  <input
                    type="file"
                    accept="application/json"
                    onChange={(event) => importFile(event.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
          </article>
        </section>
      </>
    );
  }

  const editingInvestment = data.investments.find(
    (item) => item.id === editingInvestmentId,
  );
  const editingValuation = data.valuations.find(
    (item) => item.id === editingValuationId,
  );
  const selectedLatest = latestValuation(data, selectedInvestment);
  const analysisValues = visibleTimeline.map((point) => point.value);
  const analysisStart = visibleTimeline[0]?.value ?? 0;
  const analysisLatest = visibleTimeline.at(-1)?.value ?? 0;
  const analysisChange = analysisLatest - analysisStart;
  const analysisChangePercent =
    analysisStart > 0 ? (analysisChange / analysisStart) * 100 : 0;
  const analysisLow = analysisValues.length ? Math.min(...analysisValues) : 0;
  const analysisHigh = analysisValues.length ? Math.max(...analysisValues) : 0;

  const content = {
    overview: renderOverview,
    investments: renderInvestments,
    history: renderHistory,
    forecast: renderForecast,
    settings: renderSettings,
  }[activeTab]();

  if (!loaded) {
    return (
      <main className="loading-screen">
        <BrandMark />
        <span>Opening your private ledger…</span>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className={classNames("sidebar", mobileMenu && "open")}>
        <div className="brand">
          <BrandMark />
          <span>
            <b>Aster</b>
            <small>Portfolio ledger</small>
          </span>
          <button
            className="icon-button mobile-close"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav aria-label="Primary navigation">
          {NAVIGATION.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={activeTab === item.id ? "active" : ""}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenu(false);
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="privacy-note">
            <ShieldCheck size={17} />
            <span>
              <b>Private by design</b>
              <small>{localOnly ? "Local storage + JSON backups" : "Offline cache + account cloud"}</small>
            </span>
          </div>
          <div className="sync-state">
            {online ? <Cloud size={15} /> : <CloudOff size={15} />}
            <span>
              {localOnly ? "Saved on this device" : syncing ? "Syncing…" : online ? "Online" : "Offline mode"}
            </span>
            <i className={online ? "online" : ""} />
          </div>
        </div>
      </aside>

      {mobileMenu && (
        <button
          className="sidebar-scrim"
          onClick={() => setMobileMenu(false)}
          aria-label="Close navigation"
        />
      )}

      <main className="main-content">
        <div className="mobile-topbar">
          <button
            className="icon-button"
            onClick={() => setMobileMenu(true)}
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>
          <span className="mobile-brand">
            <BrandMark /> Aster
          </span>
          <button
            className="icon-button add-mobile"
            onClick={() =>
              data.investments.length ? openValuation() : openInvestment()
            }
            aria-label="Add entry"
          >
            <Plus size={21} />
          </button>
        </div>
        {content}
      </main>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {NAVIGATION.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={activeTab === item.id ? "active" : ""}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {toast && <div className="toast">{toast}</div>}

      {modal === "analysis" && (
        <ModalShell
          title="Portfolio timeline"
          subtitle="Explore total portfolio value at every recorded date. Hover or drag across chart to inspect snapshots."
          eyebrow="Performance analysis"
          wide
          onClose={() => setModal(null)}
        >
          <div className="analysis-toolbar">
            <ChartRangePicker value={chartRange} onChange={setChartRange} />
            <CurrencyToggle value={currency} onChange={setCurrency} />
          </div>
          <div className="analysis-chart-panel">
            <div className="analysis-chart">
              <ValueChart
                points={visibleTimeline}
                currency={currency}
                interactive
              />
            </div>
            <div className="chart-dates">
              <span>
                {visibleTimeline[0]
                  ? shortDate(visibleTimeline[0].date)
                  : "First entry"}
              </span>
              <span>{visibleTimeline.length} timeline points</span>
              <span>
                {visibleTimeline.at(-1)
                  ? shortDate(visibleTimeline.at(-1)!.date)
                  : "Today"}
              </span>
            </div>
          </div>
          <section className="analysis-metrics" aria-label="Period summary">
            <article>
              <small>Starting snapshot</small>
              <strong>{formatMoney(analysisStart, currency)}</strong>
            </article>
            <article>
              <small>Latest snapshot</small>
              <strong>{formatMoney(analysisLatest, currency)}</strong>
            </article>
            <article>
              <small>Period change</small>
              <strong className={analysisChange < 0 ? "negative" : ""}>
                {analysisChange >= 0 ? "+" : ""}
                {formatMoney(analysisChange, currency)}
              </strong>
              <span>
                {analysisChangePercent >= 0 ? "+" : ""}
                {analysisChangePercent.toFixed(1)}%
              </span>
            </article>
            <article>
              <small>Observed range</small>
              <strong>{formatMoney(analysisLow, currency)}</strong>
              <span>to {formatMoney(analysisHigh, currency)}</span>
            </article>
          </section>
          <section className="snapshot-analysis">
            <div className="snapshot-analysis-heading">
              <div>
                <p className="eyebrow">Visible period</p>
                <h3>Portfolio snapshots</h3>
              </div>
              <span>{visibleTimeline.length} dates</span>
            </div>
            <div className="snapshot-analysis-table">
              <div className="snapshot-analysis-row head">
                <span>Date</span>
                <span>Total value</span>
                <span>Change</span>
                <span>Change %</span>
              </div>
              {visibleTimeline
                .map((point, index) => {
                  const previousPoint = visibleTimeline[index - 1];
                  const change = previousPoint
                    ? point.value - previousPoint.value
                    : null;
                  const percent =
                    change !== null && previousPoint.value > 0
                      ? (change / previousPoint.value) * 100
                      : null;
                  return (
                    <div className="snapshot-analysis-row" key={point.date}>
                      <span data-label="Date">{shortDate(point.date)}</span>
                      <strong data-label="Total value">
                        {formatMoney(point.value, currency)}
                      </strong>
                      <span
                        data-label="Change"
                        className={change !== null && change < 0 ? "negative" : ""}
                      >
                        {change === null
                          ? "—"
                          : `${change >= 0 ? "+" : ""}${formatMoney(change, currency)}`}
                      </span>
                      <span
                        data-label="Change %"
                        className={
                          percent !== null && percent < 0 ? "negative" : ""
                        }
                      >
                        {percent === null
                          ? "—"
                          : `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`}
                      </span>
                    </div>
                  );
                })
                .reverse()}
            </div>
          </section>
          <p className="analysis-note">
            Historical points use FX rate stored with each snapshot. Current
            headline may differ because it uses latest EUR/INR rate.
          </p>
        </ModalShell>
      )}

      {modal === "investment" && (
        <ModalShell
          title={editingInvestment ? "Edit investment" : "Create investment"}
          subtitle={
            editingInvestment
              ? "Update name, type, default currency, or expected growth. Stable portfolio ID and valuation history stay unchanged."
              : "Create once, then update details and monthly values without rebuilding history."
          }
          onClose={() => setModal(null)}
        >
          <form
            className="entry-form"
            onSubmit={saveInvestment}
            key={editingInvestment?.id ?? "new-investment"}
          >
            <label>
              Investment name
              <input
                name="name"
                required
                placeholder="e.g. Global equity ETF"
                defaultValue={editingInvestment?.name ?? ""}
              />
            </label>
            <div className="form-row">
              <label>
                Type / category
                <input
                  name="category"
                  required
                  placeholder="e.g. Equity"
                  defaultValue={editingInvestment?.category ?? ""}
                />
              </label>
              <label>
                Native currency
                <select
                  name="currency"
                  defaultValue={editingInvestment?.currency ?? "EUR"}
                >
                  <option value="EUR">EUR — Euro</option>
                  <option value="INR">INR — Indian rupee</option>
                </select>
              </label>
            </div>
            <label>
              Expected annual return
              <div className="input-suffix">
                <input
                  name="return"
                  type="number"
                  min="-100"
                  max="100"
                  step="0.1"
                  defaultValue={editingInvestment?.expectedAnnualReturn ?? 7}
                  required
                />
                <span>% p.a.</span>
              </div>
            </label>
            {editingInvestment && (
              <p className="form-note">
                Historical snapshots keep their original currency and FX rate.
                Currency change becomes default for future updates.
              </p>
            )}
            <button className="primary-button form-submit" type="submit">
              {editingInvestment ? "Save changes" : "Create investment"}{" "}
              {editingInvestment ? <Check size={17} /> : <ArrowUpRight size={17} />}
            </button>
          </form>
        </ModalShell>
      )}

      {modal === "valuation" && (
        <ModalShell
          title={editingValuation ? "Edit snapshot" : "Update current value"}
          subtitle={
            editingValuation
              ? "Correct this historical point. Timeline recalculates without changing portfolio identity."
              : "Latest amount is prefilled. Saving a new date adds one time-series point; saving same date updates that point."
          }
          onClose={() => setModal(null)}
        >
          <form className="entry-form" onSubmit={saveValuation}>
            <label>
              Investment
              <select
                name="investment"
                value={selectedInvestment}
                onChange={(event) => {
                  const investmentId = event.target.value;
                  if (editingValuationId) {
                    setSelectedInvestment(investmentId);
                  } else {
                    setValuationDefaults(investmentId);
                  }
                }}
                required
              >
                {data.investments.map((investment) => (
                  <option key={investment.id} value={investment.id}>
                    {investment.name} ({investment.currency})
                  </option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label>
                Current value
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  required
                  placeholder="0"
                  value={valuationAmount}
                  onChange={(event) => setValuationAmount(event.target.value)}
                />
                {selectedLatest && !editingValuation && (
                  <small>
                    Previous:{" "}
                    {formatMoney(selectedLatest.amount, selectedLatest.currency)} on{" "}
                    {shortDate(selectedLatest.valuedAt)}
                  </small>
                )}
              </label>
              <label>
                Valuation date
                <input
                  name="date"
                  type="date"
                  value={valuationDate}
                  onChange={(event) => setValuationDate(event.target.value)}
                  required
                />
              </label>
            </div>
            <label>
              Value currency
              <select
                name="currency"
                value={valuationCurrency}
                onChange={(event) =>
                  setValuationCurrency(event.target.value as Currency)
                }
              >
                <option value="EUR">EUR — Euro</option>
                <option value="INR">INR — Indian rupee</option>
              </select>
              <small>
                Each snapshot stores its own currency. Portfolio default can change
                later.
              </small>
            </label>
            <label>
              EUR/INR rate for this date
              <div className="input-suffix">
                <input
                  name="rate"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={valuationRate}
                  onChange={(event) => setValuationRate(event.target.value)}
                  required
                />
                <span>₹ per €</span>
              </div>
              <small>
                {data.lastFxDate
                  ? `Latest fetched rate: ${data.lastFxRate.toFixed(4)} on ${data.lastFxDate}`
                  : "Edit manually when entering a historical date."}
              </small>
            </label>
            <label>
              Note <span className="optional">Optional</span>
              <input
                name="note"
                placeholder="e.g. Monthly statement"
                value={valuationNote}
                onChange={(event) => setValuationNote(event.target.value)}
              />
            </label>
            <button className="primary-button form-submit" type="submit">
              {editingValuation ? "Save correction" : "Save snapshot"}{" "}
              <Check size={17} />
            </button>
          </form>
        </ModalShell>
      )}
    </div>
  );
}

function CurrencyToggle({
  value,
  onChange,
}: {
  value: Currency;
  onChange: (value: Currency) => void;
}) {
  return (
    <div className="currency-toggle" aria-label="Display currency">
      {(["EUR", "INR"] as const).map((currency) => (
        <button
          key={currency}
          className={value === currency ? "active" : ""}
          onClick={() => onChange(currency)}
        >
          {currency === "EUR" ? "€ EUR" : "₹ INR"}
        </button>
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  copy,
  action,
  onAction,
}: {
  icon: ReactNode;
  title: string;
  copy: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state">
      <span>{icon}</span>
      <b>{title}</b>
      <p>{copy}</p>
      {action && onAction && (
        <button className="text-button" onClick={onAction}>
          {action} <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}
