import { useMemo, useState, type ReactNode } from "react";
import type { InspectionElement } from "@/lib/report.api";
import { getElementStatus, statusStroke, type Status } from "@/lib/report.utils";


function rank(s: Status) {
  return s === "serious" ? 3 : s === "minor" ? 2 : 1;
}

export interface SchemaCanvasApi {
  /** Currently highlighted zone key (synced with sidebar hover). */
  hoverKey: string | null;
  /** Set the highlighted zone key. */
  setHoverKey: (k: string | null) => void;
}

export interface SchemaShellProps {
  elements: InspectionElement[];
  /** Render the canvas; receives shared hover state. */
  canvas: (api: SchemaCanvasApi) => ReactNode;
  /** Map an element to its zone key (must match keys used inside the canvas). */
  zoneKeyForElement: (el: InspectionElement) => string | null;
  /** Human-readable label for an element (used in sidebar + tooltip). */
  zoneLabelForElement: (el: InspectionElement) => string;
  /** Map a hovered zone key back to a label (for the floating tooltip). */
  zoneLabelForKey?: (key: string) => string | null;
  onElementClick?: (el: InspectionElement) => void;
  /** Optional controls rendered above the canvas (e.g. side toggle). */
  header?: ReactNode;
  /** Wrap canvas in the soft panel background (default true). Disable for photo backdrops. */
  canvasPanel?: boolean;
  /** Hide the floating hover label rendered at the bottom of the canvas. */
  hideHoverLabel?: boolean;
  /** Render the canvas even when there are no elements (suppresses empty-state). */
  alwaysRenderCanvas?: boolean;
  /** Empty-state copy when no elements in this section. */
  emptyText?: string;
  /** Hint shown under the layout. */
  footerHint?: string;
}

const LEGEND: { key: Status; label: string; color: string }[] = [
  { key: "ok", label: "Без замечаний", color: "var(--grade-good)" },
  { key: "minor", label: "Внимание", color: "var(--grade-warn)" },
  { key: "serious", label: "Повреждения", color: "var(--grade-bad)" },
];

export function SchemaShell({
  elements,
  canvas,
  zoneKeyForElement,
  zoneLabelForElement,
  zoneLabelForKey,
  onElementClick,
  header,
  canvasPanel = true,
  hideHoverLabel = false,
  alwaysRenderCanvas = false,
  emptyText = "Нет данных",
  footerHint = "Наведите или нажмите на элемент, чтобы увидеть детали и связанные фото",
}: SchemaShellProps) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  const damaged = useMemo(
    () =>
      elements
        .filter(
          (e) =>
            e.note ||
            e.seriousDamageTags.length > 0 ||
            e.noSeriousDamageTags.length > 0 ||
            e.paintworkThicknessFrom != null ||
            e.paintworkThicknessTo != null,
        )
        .sort((a, b) => rank(getElementStatus(b)) - rank(getElementStatus(a))),
    [elements],
  );

  const hoverLabel = hoverKey
    ? zoneLabelForKey?.(hoverKey) ??
      zoneLabelForElement(
        elements.find((e) => zoneKeyForElement(e) === hoverKey) ?? ({} as InspectionElement),
      )
    : null;

  const isEmpty = !elements || elements.length === 0;

  return (
    <div className="flex flex-col gap-3">
      {header}

      <div className="grid md:grid-cols-[1fr_minmax(200px,260px)] gap-4">
        <div
          className={
            canvasPanel
              ? "relative rounded-lg px-3 py-1 body-schema-canvas"
              : "relative"
          }
          style={
            canvasPanel
              ? {
                  background:
                    "linear-gradient(180deg, oklch(0.985 0.003 250) 0%, oklch(0.97 0.004 250) 100%)",
                  border: "1px solid var(--border)",
                }
              : undefined
          }
        >
          {isEmpty && !alwaysRenderCanvas ? (
            <div className="flex items-center justify-center text-sm text-muted-foreground py-16">
              {emptyText}
            </div>
          ) : (
            <>
              {canvas({ hoverKey, setHoverKey })}
              {hoverLabel && !hideHoverLabel && (
                <div
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-2 px-2.5 py-1 rounded-md text-xs font-medium shadow-sm"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {hoverLabel}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 h-full min-h-0">
          <div className="flex flex-col gap-1.5">
            {LEGEND.map((l) => (
              <div key={l.key} className="flex items-center gap-2 text-xs">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: l.color }}
                />
                <span className="text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>

          {damaged.length > 0 && (
            <div className="border-t border-border pt-3 mt-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Заметки
              </div>
              <div className="flex flex-col gap-2 max-h-[320px] overflow-auto">
                {damaged.map((el) => {
                  const st = getElementStatus(el);
                  const zoneKey = zoneKeyForElement(el);
                  const allTags = [...el.seriousDamageTags, ...el.noSeriousDamageTags];
                  const pf = el.paintworkThicknessFrom;
                  const pt = el.paintworkThicknessTo;
                  const paint =
                    pf != null || pt != null
                      ? pf != null && pt != null && pf !== pt
                        ? `${pf}–${pt} мкм`
                        : `${pf ?? pt} мкм`
                      : null;

                  return (
                    <button
                      key={el.id}
                      type="button"
                      onMouseEnter={() => zoneKey && setHoverKey(zoneKey)}
                      onMouseLeave={() => setHoverKey(null)}
                      onClick={() => onElementClick?.(el)}
                      className="text-left text-xs hover:bg-muted/60 rounded p-1.5 -mx-1.5 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: statusStroke(st) }}
                          />
                          <span className="font-medium ink truncate">
                            {zoneLabelForElement(el)}
                          </span>
                          {paint && (
                            <span className="ml-auto mono text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground flex-shrink-0">
                              ЛКП {paint}
                            </span>
                          )}
                        </div>
                        {(el.note || allTags.length > 0) && (
                          <div className="ml-4 mt-1">
                            {el.note && (
                              <div className="text-[11px] leading-[1.35] text-muted-foreground whitespace-pre-wrap break-words">
                                {el.note}
                              </div>
                            )}
                            {allTags.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {allTags.map((t) => (
                                  <span
                                    key={t.id}
                                    className="text-[10px] px-1.5 py-0.5 rounded-full border"
                                    style={{
                                      background:
                                        t.type === "serious"
                                          ? "color-mix(in oklch, var(--grade-bad) 12%, transparent)"
                                          : "color-mix(in oklch, var(--grade-warn) 14%, transparent)",
                                      borderColor:
                                        t.type === "serious"
                                          ? "color-mix(in oklch, var(--grade-bad) 35%, transparent)"
                                          : "color-mix(in oklch, var(--grade-warn) 40%, transparent)",
                                      color: "var(--foreground)",
                                    }}
                                  >
                                    {t.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </button>

                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {!isEmpty && (
        <p className="text-[11px] text-muted-foreground text-center">{footerHint}</p>
      )}
    </div>
  );
}
