import { useState } from "react";
import { Check, AlertTriangle, AlertOctagon } from "lucide-react";

type Severity = "ok" | "minor" | "serious";

type HistoryEntry = {
  id: string;
  date: string; // "12.04.2024"
  time: string; // "10:37"
  severity: Severity;
  title: string;
  note: string;
  thumb?: string;
  reportNumber?: string;
};

const MOCK_HISTORY: HistoryEntry[] = [
  {
    id: "1",
    date: "12.04.2024",
    time: "10:37",
    severity: "ok",
    title: "Подтверждено специалистом",
    note: "Вмятина на правой передней двери. Рекомендуется локальный окрас.",
    reportNumber: "REP-A872416",
  },
  {
    id: "2",
    date: "12.04.2024",
    time: "10:24",
    severity: "minor",
    title: "Обнаружено",
    note: "Небольшая вмятина на правой передней двери.",
    reportNumber: "REP-A861203",
  },
  {
    id: "3",
    date: "08.02.2024",
    time: "09:50",
    severity: "serious",
    title: "Обнаружено",
    note: "Царапины на заднем бампере справа.",
    reportNumber: "REP-A754119",
  },
  {
    id: "4",
    date: "08.02.2024",
    time: "09:20",
    severity: "serious",
    title: "Обнаружено",
    note: "Царапины на переднем бампере с левой стороны.",
    reportNumber: "REP-A754118",
  },
  {
    id: "5",
    date: "15.11.2023",
    time: "14:02",
    severity: "minor",
    title: "Обнаружено",
    note: "Скол ЛКП на капоте.",
    reportNumber: "REP-A612084",
  },
  {
    id: "6",
    date: "03.07.2023",
    time: "11:48",
    severity: "ok",
    title: "Без замечаний",
    note: "Кузов и салон в норме.",
    reportNumber: "REP-A488733",
  },
];

function severityVisual(s: Severity) {
  if (s === "ok") {
    return {
      Icon: Check,
      color: "var(--grade-good)",
      bg: "color-mix(in oklab, var(--grade-good) 18%, white)",
    };
  }
  if (s === "minor") {
    return {
      Icon: AlertTriangle,
      color: "var(--grade-warn)",
      bg: "color-mix(in oklab, var(--grade-warn) 22%, white)",
    };
  }
  return {
    Icon: AlertOctagon,
    color: "var(--grade-bad)",
    bg: "color-mix(in oklab, var(--grade-bad) 18%, white)",
  };
}

export function InspectionHistoryTimeline() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? MOCK_HISTORY : MOCK_HISTORY.slice(0, 4);

  return (
    <section className="panel p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          История замечаний
        </h3>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Демо · по предыдущим отчётам
        </span>
      </div>

      <ol className="relative flex flex-col gap-5">
        {/* vertical rail */}
        <span
          aria-hidden
          className="absolute left-[15px] top-2 bottom-2 w-px"
          style={{ background: "var(--border)" }}
        />

        {visible.map((e) => {
          const v = severityVisual(e.severity);
          const Icon = v.Icon;
          return (
            <li key={e.id} className="relative pl-10 flex items-start gap-3">
              <span
                className="absolute left-0 top-0.5 w-8 h-8 rounded-full flex items-center justify-center border-2"
                style={{
                  background: v.bg,
                  borderColor: v.color,
                  color: v.color,
                }}
              >
                <Icon size={14} strokeWidth={2.5} />
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mono">
                  <span>{e.date}</span>
                  <span>·</span>
                  <span>{e.time}</span>
                  {e.reportNumber && (
                    <>
                      <span>·</span>
                      <span>{e.reportNumber}</span>
                    </>
                  )}
                </div>
                <div className="text-sm font-semibold ink mt-0.5">{e.title}</div>
                <p className="text-xs text-muted-foreground leading-snug mt-1">
                  {e.note}
                </p>
              </div>

              <span
                className="flex-shrink-0 w-16 h-16 rounded-lg border border-border bg-muted flex items-center justify-center text-[10px] text-muted-foreground"
                aria-hidden
              >
                фото
              </span>
            </li>
          );
        })}
      </ol>

      {MOCK_HISTORY.length > 4 && (
        <div className="flex justify-center mt-5">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:border-accent transition-colors"
          >
            {expanded ? "Свернуть" : "Показать всю историю"}
          </button>
        </div>
      )}
    </section>
  );
}
