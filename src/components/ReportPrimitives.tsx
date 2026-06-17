export function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold ink mt-0.5">{value}</span>
    </div>
  );
}

export function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-md border border-border p-3 flex items-center justify-between bg-muted/30">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="text-base font-bold ink mono">{value}</span>
        {unit && <span className="mono text-[10px] text-muted-foreground">{unit}</span>}
      </span>
    </div>
  );
}

export function CheckRow({
  label,
  ok,
  okLabel = "Соответствует",
  failLabel = "Не соответствует",
  skipLabel = "Не указано",
}: {
  label: string;
  ok: boolean | null;
  okLabel?: string;
  failLabel?: string;
  skipLabel?: string;
}) {
  const color = ok == null ? "var(--grade-skip)" : ok ? "var(--grade-good)" : "var(--grade-bad)";
  const text = ok == null ? skipLabel : ok ? okLabel : failLabel;
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-dashed border-border last:border-0">
      <span className="text-sm">{label}</span>
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
        {text}
      </span>
    </div>
  );
}
