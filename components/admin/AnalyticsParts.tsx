import type { ReactNode } from "react";

export function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-md border border-line bg-panel p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-paper">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-line bg-panel p-6">
      <h2 className="mb-4 font-display text-lg font-semibold text-paper">{title}</h2>
      {children}
    </div>
  );
}

// Views as the full bar, unique visitors as the solid part inside it.
export function TrafficChart({
  bars,
}: {
  bars: { label: string; title: string; views: number; visitors: number }[];
}) {
  const max = Math.max(1, ...bars.map((b) => b.views));
  return (
    <div>
      <div className="flex h-48 items-end gap-1 sm:gap-1.5">
        {bars.map((b, i) => (
          <div key={`${b.title}-${i}`} title={b.title} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className="text-[10px] text-muted">{b.views > 0 && bars.length <= 31 ? b.views : ""}</span>
            <div
              className="relative w-full overflow-hidden rounded-t-sm bg-signal/25"
              style={{ height: `${Math.max(b.views ? 4 : 2, Math.round((b.views / max) * 150))}px` }}
            >
              <div
                className="absolute inset-x-0 bottom-0 bg-signal"
                style={{ height: `${b.views ? Math.round((b.visitors / b.views) * 100) : 0}%` }}
              />
            </div>
            <span className="h-3 truncate text-[10px] text-muted">{b.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-signal/25" /> Views
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-signal" /> Visitors
        </span>
      </div>
    </div>
  );
}

export function BarList({ rows, empty }: { rows: { label: string; value: number }[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.label} className="relative overflow-hidden rounded-sm">
          <div className="absolute inset-y-0 left-0 bg-signal/10" style={{ width: `${(row.value / max) * 100}%` }} />
          <div className="relative flex justify-between gap-3 px-3 py-2 text-sm">
            <span className="truncate text-paper">{row.label}</span>
            <span className="shrink-0 font-semibold text-paper">{row.value}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = Math.max(1, steps[0]?.value || 0);
  return (
    <div className="space-y-4">
      {steps.map((step) => {
        const pct = Math.round((step.value / top) * 100);
        return (
          <div key={step.label}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-paper">{step.label}</span>
              <span className="text-muted">
                <span className="font-semibold text-paper">{step.value}</span> ({pct}%)
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-signal" style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Plain bar chart; labels can be blank to thin out a crowded axis. */
export function SimpleBars({ bars }: { bars: { label: string; value: number; title: string }[] }) {
  const max = Math.max(1, ...bars.map((bar) => bar.value));
  return (
    <div className="flex h-48 items-end gap-1">
      {bars.map((bar) => (
        <div key={bar.title} title={bar.title} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[10px] text-muted">{bar.value > 0 ? bar.value : ""}</span>
          <div
            className="w-full rounded-t-sm bg-signal"
            style={{
              height: `${Math.max(bar.value ? 4 : 2, Math.round((bar.value / max) * 150))}px`,
              opacity: bar.value ? 1 : 0.25,
            }}
          />
          <span className="h-3 truncate text-[10px] text-muted">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}
