import Link from "next/link";
import { PERIODS, type Period } from "@/lib/order-report";

// Today / Last 7 days / Last 30 days / This year / All time / Custom, shared
// by the Orders and Analytics pages. Extra query values (like a status filter)
// are carried along when switching.
export default function PeriodTabs({
  basePath,
  period,
  extra = {},
}: {
  basePath: string;
  period: Period;
  extra?: Record<string, string>;
}) {
  const href = (key: string) => {
    const params = new URLSearchParams({ period: key });
    if (key === "custom") {
      if (period.fromKey) params.set("from", period.fromKey);
      params.set("to", period.toKey);
    }
    for (const [name, value] of Object.entries(extra)) if (value) params.set(name, value);
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={href(p.key)}
            className={`rounded-sm px-3 py-1.5 text-sm ${period.key === p.key ? "bg-signal font-semibold text-ink" : "border border-line text-paper hover:border-signal"}`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {period.key === "custom" && (
        <form action={basePath} className="flex flex-wrap items-end gap-3 rounded-md border border-line bg-panel p-4">
          <input type="hidden" name="period" value="custom" />
          {Object.entries(extra).map(([name, value]) =>
            value ? <input key={name} type="hidden" name={name} value={value} /> : null
          )}
          <label className="text-sm text-muted">
            From
            <input type="date" name="from" defaultValue={period.fromKey ?? ""} className="mt-1 block rounded-sm border border-line bg-ink px-3 py-2 text-paper" />
          </label>
          <label className="text-sm text-muted">
            To
            <input type="date" name="to" defaultValue={period.toKey} className="mt-1 block rounded-sm border border-line bg-ink px-3 py-2 text-paper" />
          </label>
          <button type="submit" className="rounded-sm bg-signal px-4 py-2 text-sm font-semibold text-ink">
            Apply
          </button>
        </form>
      )}
    </div>
  );
}
