import { useState, useMemo } from "react";
import type { InspectionElement } from "@/lib/report.functions";

type Status = "ok" | "minor" | "serious" | "none";
type View = "top" | "front" | "rear" | "left" | "right";

const ZONE_LABEL: Record<string, string> = {
  hood: "Капот",
  roof: "Крыша",
  trunk: "Крышка багажника",
  fbumper: "Передний бампер",
  rbumper: "Задний бампер",
  flfender: "Переднее левое крыло",
  frfender: "Переднее правое крыло",
  rlfender: "Заднее левое крыло",
  rrfender: "Заднее правое крыло",
  fldoor: "Передняя левая дверь",
  frdoor: "Передняя правая дверь",
  rldoor: "Задняя левая дверь",
  rrdoor: "Задняя правая дверь",
  lthresh: "Левый порог",
  rthresh: "Правый порог",
  windshield: "Лобовое стекло",
  rear_window: "Заднее стекло",
};

const ELEMENT_ZONE: Record<string, string> = {
  hood: "hood",
  roof: "roof",
  trunk: "trunk",
  trunk_lid: "trunk",
  front_bumper: "fbumper",
  rear_bumper: "rbumper",
  front_left_fender: "flfender",
  front_right_fender: "frfender",
  rear_left_fender: "rlfender",
  rear_right_fender: "rrfender",
  front_left_door: "fldoor",
  front_right_door: "frdoor",
  rear_left_door: "rldoor",
  rear_right_door: "rrdoor",
  left_threshold: "lthresh",
  right_threshold: "rthresh",
  windshield: "windshield",
  rear_window: "rear_window",
};

function statusOf(el: InspectionElement): Status {
  if (el.seriousDamageTags.length > 0) return "serious";
  if (!el.noDamage || el.noSeriousDamageTags.length > 0) return "minor";
  return "ok";
}

function rank(s: Status) {
  return s === "serious" ? 3 : s === "minor" ? 2 : s === "ok" ? 1 : 0;
}

function fillFor(s: Status) {
  if (s === "serious") return "color-mix(in oklab, var(--grade-bad) 38%, white)";
  if (s === "minor") return "color-mix(in oklab, var(--grade-warn) 42%, white)";
  if (s === "ok") return "color-mix(in oklab, var(--grade-good) 18%, white)";
  return "white";
}
function strokeFor(s: Status, hovered: boolean) {
  if (hovered) return "var(--accent)";
  if (s === "serious") return "var(--grade-bad)";
  if (s === "minor") return "var(--grade-warn)";
  if (s === "ok") return "color-mix(in oklab, var(--grade-good) 70%, oklch(0.45 0.01 250))";
  return "oklch(0.62 0.008 250)";
}

const VIEWS: { key: View; label: string }[] = [
  { key: "top", label: "Сверху" },
  { key: "left", label: "Слева" },
  { key: "right", label: "Справа" },
  { key: "front", label: "Спереди" },
  { key: "rear", label: "Сзади" },
];

export function CarBodySchema({
  elements,
  onElementClick,
}: {
  elements: InspectionElement[];
  onElementClick?: (el: InspectionElement) => void;
}) {
  const [view, setView] = useState<View>("top");
  const [hover, setHover] = useState<string | null>(null);

  const { zoneMap, zoneElement } = useMemo(() => {
    const m = new Map<string, Status>();
    const eMap = new Map<string, InspectionElement>();
    for (const el of elements) {
      const z = ELEMENT_ZONE[el.elementType];
      if (!z) continue;
      const st = statusOf(el);
      const cur = m.get(z);
      if (!cur || rank(st) > rank(cur)) {
        m.set(z, st);
        eMap.set(z, el);
      }
    }
    return { zoneMap: m, zoneElement: eMap };
  }, [elements]);

  const statusOfZone = (id: string): Status => zoneMap.get(id) ?? "none";

  const handleZone = (id: string) => {
    const el = zoneElement.get(id);
    if (el && onElementClick) onElementClick(el);
  };

  const zoneProps = (id: string) => {
    const st = statusOfZone(id);
    const isHover = hover === id;
    const hasEl = zoneElement.has(id);
    return {
      fill: fillFor(st),
      stroke: strokeFor(st, isHover),
      strokeWidth: isHover ? 2 : 1.2,
      strokeLinejoin: "round" as const,
      style: { cursor: hasEl ? "pointer" : "default", transition: "all 140ms ease" },
      onMouseEnter: () => setHover(id),
      onMouseLeave: () => setHover(null),
      onClick: () => handleZone(id),
    };
  };

  const damaged = useMemo(
    () =>
      elements
        .filter((e) => {
          const z = ELEMENT_ZONE[e.elementType];
          return z && (statusOf(e) === "minor" || statusOf(e) === "serious");
        })
        .sort((a, b) => rank(statusOf(b)) - rank(statusOf(a))),
    [elements],
  );

  return (
    <div className="panel p-5 md:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Схема кузова
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-muted-foreground mr-1">Вид:</span>
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className="px-2.5 py-1 rounded-md text-xs font-medium border transition-colors"
              style={{
                background: view === v.key ? "var(--accent)" : "var(--card)",
                color: view === v.key ? "var(--accent-foreground)" : "var(--foreground)",
                borderColor: view === v.key ? "var(--accent)" : "var(--border)",
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_minmax(180px,240px)] gap-4">
        <div
          className="relative rounded-lg p-3 body-schema-canvas"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.985 0.003 250) 0%, oklch(0.97 0.004 250) 100%)",
            border: "1px solid var(--border)",
          }}
        >
          {view === "top" && <TopView zoneProps={zoneProps} />}
          {view === "front" && <FrontView zoneProps={zoneProps} />}
          {view === "rear" && <RearView zoneProps={zoneProps} />}
          {view === "left" && <SideView zoneProps={zoneProps} side="left" />}
          {view === "right" && <SideView zoneProps={zoneProps} side="right" />}
          {hover && (
            <div
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-2 px-2.5 py-1 rounded-md text-xs font-medium shadow-sm"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              {ZONE_LABEL[hover] ?? hover}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            {(
              [
                ["ok", "Без замечаний", "var(--grade-good)"],
                ["minor", "Внимание", "var(--grade-warn)"],
                ["serious", "Повреждения", "var(--grade-bad)"],
                ["none", "Не проверялось", "oklch(0.82 0.005 250)"],
              ] as const
            ).map(([k, label, color]) => (
              <div key={k} className="flex items-center gap-2 text-xs">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          {damaged.length > 0 && (
            <div className="border-t border-border pt-3 mt-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                Замечания
              </div>
              <div className="flex flex-col gap-2 max-h-[280px] overflow-auto">
                {damaged.map((el) => {
                  const z = ELEMENT_ZONE[el.elementType];
                  const st = statusOf(el);
                  const tag = el.seriousDamageTags[0]?.name ?? el.noSeriousDamageTags[0]?.name;
                  return (
                    <button
                      key={el.id}
                      type="button"
                      onMouseEnter={() => setHover(z)}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => onElementClick?.(el)}
                      className="text-left text-xs hover:bg-muted/60 rounded p-1.5 -mx-1.5 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            background:
                              st === "serious" ? "var(--grade-bad)" : "var(--grade-warn)",
                          }}
                        />
                        <span className="font-medium ink truncate">
                          {ZONE_LABEL[z] ?? el.elementType.replace(/_/g, " ")}
                        </span>
                      </div>
                      {tag && (
                        <div className="text-[11px] text-muted-foreground ml-4 mt-0.5 truncate">
                          {tag}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground text-center">
        Наведите или нажмите на элемент, чтобы увидеть детали и связанные фото
      </p>
    </div>
  );
}

type ZoneProps = (id: string) => {
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeLinejoin: "round";
  style: React.CSSProperties;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
};

/* ===================================================================
 * Эскизы кузова — Audi A6 Allroad (универсал).
 * Длинный капот, вагонный профиль, рейлинги, чёрный обвес арок,
 * фирменная Singleframe-решётка и узкие Matrix LED фары.
 * Единый минималистичный стиль auction-sheet.
 * =================================================================== */

const OUTLINE = "oklch(0.45 0.012 250)";
const DIVIDER = "oklch(0.68 0.008 250)";
const GLASS_TINT = "oklch(0.9 0.014 235)";
const DARK = "oklch(0.24 0.012 250)";
const CLADDING = "oklch(0.32 0.008 250)";
const LAMP = "oklch(0.95 0.025 95)";
const TAIL = "color-mix(in oklab, var(--grade-bad) 55%, oklch(0.3 0.05 25))";

/* ---------------- TOP — вид сверху ---------------- */
function TopView({ zoneProps }: { zoneProps: ZoneProps }) {
  return (
    <svg
      viewBox="0 0 280 640"
      className="w-full h-auto max-h-[540px] mx-auto block"
      role="img"
      aria-label="Audi A6 Allroad — вид сверху"
    >
      {/* силуэт универсала: плечи, ровные борта, аккуратная корма */}
      <path
        d="M70,28 Q140,8 210,28 Q246,40 252,96 L254,556 Q250,604 214,616 Q140,634 66,616 Q30,604 26,556 L28,96 Q34,40 70,28 Z"
        fill="white" stroke={OUTLINE} strokeWidth="1.6" strokeLinejoin="round"
      />

      {/* передний бампер с воздухозаборниками */}
      <path d="M46,52 Q140,30 234,52 L230,90 Q140,74 50,90 Z" {...zoneProps("fbumper")} />
      <rect x="64" y="60" width="40" height="18" rx="3" fill={DARK} opacity="0.55" />
      <rect x="176" y="60" width="40" height="18" rx="3" fill={DARK} opacity="0.55" />

      {/* передние крылья */}
      <path d="M28,90 L70,90 L70,170 L30,170 Q24,128 28,90 Z" {...zoneProps("flfender")} />
      <path d="M252,90 L210,90 L210,170 L250,170 Q256,128 252,90 Z" {...zoneProps("frfender")} />

      {/* длинный капот с power-domes */}
      <path d="M70,90 L210,90 L210,196 L70,196 Z" {...zoneProps("hood")} />
      <path d="M88,100 Q140,94 192,100 L188,190 Q140,184 92,190 Z"
        fill="none" stroke={DIVIDER} strokeWidth="0.5" strokeDasharray="3 3" />
      <line x1="140" y1="96" x2="140" y2="194" stroke={DIVIDER} strokeWidth="0.5" strokeDasharray="3 3" />

      {/* лобовое — наклонное, со сдвигом плеч */}
      <path d="M70,196 L210,196 L194,256 L86,256 Z" {...zoneProps("windshield")} />

      {/* крыша с рейлингами allroad */}
      <path d="M86,256 L194,256 L194,438 L86,438 Z" {...zoneProps("roof")} />
      <line x1="86" y1="256" x2="86" y2="438" stroke={DARK} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="194" y1="256" x2="194" y2="438" stroke={DARK} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="140" y1="262" x2="140" y2="432" stroke={DIVIDER} strokeWidth="0.5" strokeDasharray="2 4" />

      {/* пороги с накладками allroad */}
      <path d="M28,256 L70,256 L70,438 L28,438 Z" {...zoneProps("lthresh")} />
      <path d="M252,256 L210,256 L210,438 L252,438 Z" {...zoneProps("rthresh")} />
      <rect x="28" y="332" width="6" height="30" fill={CLADDING} opacity="0.5" />
      <rect x="246" y="332" width="6" height="30" fill={CLADDING} opacity="0.5" />

      {/* двери */}
      <path d="M70,256 L86,256 L86,344 L70,344 Z" {...zoneProps("fldoor")} />
      <path d="M210,256 L194,256 L194,344 L210,344 Z" {...zoneProps("frdoor")} />
      <path d="M70,346 L86,346 L86,438 L70,438 Z" {...zoneProps("rldoor")} />
      <path d="M210,346 L194,346 L194,438 L210,438 Z" {...zoneProps("rrdoor")} />
      <line x1="86" y1="345" x2="194" y2="345" stroke={DIVIDER} strokeWidth="0.6" />

      {/* зеркала */}
      <path d="M14,238 Q4,242 6,250 Q10,254 22,252 L26,242 Z" fill={DARK} />
      <path d="M266,238 Q276,242 274,250 Q270,254 258,252 L254,242 Z" fill={DARK} />

      {/* задние крылья с расширителями */}
      <path d="M28,438 L70,438 L70,506 Q48,504 30,498 Q24,468 28,438 Z" {...zoneProps("rlfender")} />
      <path d="M252,438 L210,438 L210,506 Q232,504 250,498 Q256,468 252,438 Z" {...zoneProps("rrfender")} />

      {/* заднее стекло (более вертикальное у универсала) */}
      <path d="M86,440 L194,440 L210,488 L70,488 Z" {...zoneProps("rear_window")} />
      <g stroke={DIVIDER} strokeWidth="0.4" opacity="0.6">
        <line x1="92" y1="454" x2="188" y2="454" />
        <line x1="88" y1="464" x2="192" y2="464" />
        <line x1="84" y1="474" x2="196" y2="474" />
      </g>

      {/* крышка багажника */}
      <path d="M70,490 L210,490 L210,568 L70,568 Z" {...zoneProps("trunk")} />
      <circle cx="140" cy="510" r="6" fill="none" stroke={DARK} strokeWidth="0.8" />
      <path d="M134,510 a6,3 0 0,0 12,0" fill="none" stroke={DARK} strokeWidth="0.6" />
      <line x1="140" y1="498" x2="140" y2="562" stroke={DIVIDER} strokeWidth="0.5" strokeDasharray="3 3" />

      {/* задний бампер с диффузором */}
      <path d="M50,570 L230,570 L234,600 Q140,618 46,600 Z" {...zoneProps("rbumper")} />
      <rect x="86" y="586" width="30" height="10" rx="2" fill={DARK} opacity="0.6" />
      <rect x="164" y="586" width="30" height="10" rx="2" fill={DARK} opacity="0.6" />

      {/* индикатор «перёд» */}
      <g opacity="0.5">
        <path d="M140,14 L147,28 L133,28 Z" fill={OUTLINE} />
      </g>
    </svg>
  );
}

/* ---------------- FRONT — вид спереди ---------------- */
function FrontView({ zoneProps }: { zoneProps: ZoneProps }) {
  return (
    <svg
      viewBox="0 0 440 290"
      className="w-full h-auto max-h-[420px] mx-auto block"
      role="img"
      aria-label="Audi A6 Allroad — вид спереди"
    >
      <ellipse cx="220" cy="272" rx="190" ry="5" fill={OUTLINE} opacity="0.22" />

      {/* рейлинги */}
      <rect x="146" y="48" width="148" height="4" rx="2" fill={DARK} />

      {/* крыша — широкая, скруглённая */}
      <path d="M154,54 Q220,38 286,54 L274,92 Q220,82 166,92 Z" {...zoneProps("roof")} />

      {/* лобовое */}
      <path d="M166,92 Q220,84 274,92 L262,140 Q220,128 178,140 Z" {...zoneProps("windshield")} />
      {/* A-стойки */}
      <line x1="166" y1="92" x2="154" y2="54" stroke={OUTLINE} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="274" y1="92" x2="286" y2="54" stroke={OUTLINE} strokeWidth="1.4" strokeLinecap="round" />

      {/* капот с характерными гранями Audi */}
      <path d="M86,142 Q128,136 178,140 L262,140 Q312,136 354,142 L340,182 Q220,168 100,182 Z" {...zoneProps("hood")} />
      <path d="M178,142 L186,178 M262,142 L254,178" stroke={DIVIDER} strokeWidth="0.5" strokeDasharray="3 3" fill="none" />

      {/* крылья */}
      <path d="M36,216 Q40,172 86,142 L100,182 L78,232 Q56,232 36,228 Z" {...zoneProps("flfender")} />
      <path d="M404,216 Q400,172 354,142 L340,182 L362,232 Q384,232 404,228 Z" {...zoneProps("frfender")} />

      {/* передний бампер */}
      <path d="M40,218 L400,218 Q406,236 396,256 L44,256 Q34,236 40,218 Z" {...zoneProps("fbumper")} />

      {/* Singleframe — фирменная решётка Audi (шестиугольник) */}
      <path d="M168,184 L272,184 L262,242 L178,242 Z" fill={DARK} stroke={OUTLINE} strokeWidth="0.8" strokeLinejoin="round" />
      {/* вертикальные ламели */}
      <g stroke="oklch(0.42 0.01 250)" strokeWidth="0.6">
        {[180, 190, 200, 210, 220, 230, 240, 250].map((x) => (
          <line key={x} x1={x} y1="190" x2={x - (x - 220) * 0.08} y2="236" />
        ))}
      </g>
      {/* кольца Audi */}
      <g fill="none" stroke={GLASS_TINT} strokeWidth="1.2">
        <circle cx="208" cy="212" r="5.5" />
        <circle cx="216" cy="212" r="5.5" />
        <circle cx="224" cy="212" r="5.5" />
        <circle cx="232" cy="212" r="5.5" />
      </g>

      {/* нижние воздухозаборники */}
      <rect x="60" y="232" width="80" height="14" rx="3" fill={DARK} opacity="0.55" />
      <rect x="300" y="232" width="80" height="14" rx="3" fill={DARK} opacity="0.55" />

      {/* Matrix LED — узкие угловатые фары */}
      <path d="M84,184 L150,182 Q156,196 150,206 L94,208 Q78,202 84,184 Z"
        fill={LAMP} stroke={OUTLINE} strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M356,184 L290,182 Q284,196 290,206 L346,208 Q362,202 356,184 Z"
        fill={LAMP} stroke={OUTLINE} strokeWidth="0.9" strokeLinejoin="round" />
      {/* DRL signature */}
      <path d="M92,190 L146,189 M298,189 L348,190" stroke={OUTLINE} strokeWidth="0.6" fill="none" opacity="0.55" />

      {/* номерной знак */}
      <rect x="192" y="246" width="56" height="14" rx="2" fill="white" stroke={OUTLINE} strokeWidth="0.6" />

      {/* колёсные арки с allroad-обвесом */}
      <path d="M40,256 Q34,272 52,272 L96,272 Q106,256 92,248 L78,232 Q56,232 40,256 Z"
        fill={CLADDING} opacity="0.85" />
      <path d="M400,256 Q406,272 388,272 L344,272 Q334,256 348,248 L362,232 Q384,232 400,256 Z"
        fill={CLADDING} opacity="0.85" />

      {/* зеркала */}
      <path d="M30,140 Q14,142 16,154 Q28,158 46,150 Z" fill={DARK} />
      <path d="M410,140 Q426,142 424,154 Q412,158 394,150 Z" fill={DARK} />
    </svg>
  );
}

/* ---------------- REAR — вид сзади ---------------- */
function RearView({ zoneProps }: { zoneProps: ZoneProps }) {
  return (
    <svg
      viewBox="0 0 440 290"
      className="w-full h-auto max-h-[420px] mx-auto block"
      role="img"
      aria-label="Audi A6 Allroad — вид сзади"
    >
      <ellipse cx="220" cy="272" rx="190" ry="5" fill={OUTLINE} opacity="0.22" />

      {/* рейлинги */}
      <rect x="146" y="48" width="148" height="4" rx="2" fill={DARK} />

      {/* крыша */}
      <path d="M154,54 Q220,38 286,54 L274,90 Q220,80 166,90 Z" {...zoneProps("roof")} />

      {/* заднее стекло с обогревом */}
      <path d="M166,90 Q220,82 274,90 L262,148 Q220,136 178,148 Z" {...zoneProps("rear_window")} />
      <g stroke={DIVIDER} strokeWidth="0.4" opacity="0.7">
        <line x1="178" y1="104" x2="262" y2="104" />
        <line x1="178" y1="114" x2="262" y2="114" />
        <line x1="178" y1="124" x2="262" y2="124" />
        <line x1="178" y1="134" x2="262" y2="134" />
      </g>
      <line x1="166" y1="90" x2="154" y2="54" stroke={OUTLINE} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="274" y1="90" x2="286" y2="54" stroke={OUTLINE} strokeWidth="1.4" strokeLinecap="round" />

      {/* крышка багажника */}
      <path d="M86,150 Q128,146 178,148 L262,148 Q312,146 354,150 L340,210 Q220,196 100,210 Z" {...zoneProps("trunk")} />
      {/* кольца Audi */}
      <g fill="none" stroke={DARK} strokeWidth="1">
        <circle cx="208" cy="174" r="5" />
        <circle cx="216" cy="174" r="5" />
        <circle cx="224" cy="174" r="5" />
        <circle cx="232" cy="174" r="5" />
      </g>
      <rect x="194" y="188" width="52" height="4" rx="1.5" fill={DARK} />

      {/* задние фонари — горизонтальная LED-полоса (фирменная) */}
      <path d="M62,150 L160,150 Q168,168 162,196 L72,196 Q56,178 62,150 Z"
        fill={TAIL} stroke={OUTLINE} strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M378,150 L280,150 Q272,168 278,196 L368,196 Q384,178 378,150 Z"
        fill={TAIL} stroke={OUTLINE} strokeWidth="0.8" strokeLinejoin="round" />
      {/* световая перемычка через всю корму */}
      <line x1="160" y1="166" x2="280" y2="166" stroke={TAIL} strokeWidth="2.2" strokeLinecap="round" opacity="0.75" />

      {/* задние крылья */}
      <path d="M36,216 Q40,176 62,150 L72,196 L78,232 Q56,232 36,228 Z" {...zoneProps("rlfender")} />
      <path d="M404,216 Q400,176 378,150 L368,196 L362,232 Q384,232 404,228 Z" {...zoneProps("rrfender")} />

      {/* задний бампер */}
      <path d="M40,218 L400,218 Q406,238 394,256 L44,256 Q34,238 40,218 Z" {...zoneProps("rbumper")} />

      {/* номерной знак */}
      <rect x="192" y="222" width="56" height="18" rx="2" fill="white" stroke={OUTLINE} strokeWidth="0.6" />

      {/* двойной выхлоп */}
      <rect x="92" y="248" width="36" height="8" rx="2" fill={DARK} />
      <rect x="312" y="248" width="36" height="8" rx="2" fill={DARK} />

      {/* allroad обвес арок */}
      <path d="M40,256 Q34,272 52,272 L96,272 Q106,256 92,248 L78,232 Q56,232 40,256 Z"
        fill={CLADDING} opacity="0.85" />
      <path d="M400,256 Q406,272 388,272 L344,272 Q334,256 348,248 L362,232 Q384,232 400,256 Z"
        fill={CLADDING} opacity="0.85" />
    </svg>
  );
}

/* ---------------- SIDE — вид сбоку (Audi A6 Allroad wagon) ---------------- */
function SideView({
  zoneProps,
  side,
}: {
  zoneProps: ZoneProps;
  side: "left" | "right";
}) {
  const isLeft = side === "left";
  const fender = (pos: "front" | "rear") =>
    pos === "front"
      ? isLeft ? "flfender" : "frfender"
      : isLeft ? "rlfender" : "rrfender";
  const door = (pos: "front" | "rear") =>
    pos === "front"
      ? isLeft ? "fldoor" : "frdoor"
      : isLeft ? "rldoor" : "rrdoor";
  const thresh = isLeft ? "lthresh" : "rthresh";

  return (
    <svg
      viewBox="0 0 640 260"
      className="w-full h-auto max-h-[360px] mx-auto block"
      role="img"
      aria-label={`Audi A6 Allroad — вид ${isLeft ? "слева" : "справа"}`}
    >
      <g transform={isLeft ? "" : "translate(640,0) scale(-1,1)"}>
        <ellipse cx="320" cy="232" rx="290" ry="5" fill={OUTLINE} opacity="0.22" />

        {/* рейлинги на крыше */}
        <path d="M200,48 Q260,38 360,38 Q420,40 458,52 L450,58 Q418,48 360,46 Q262,46 206,56 Z"
          fill={DARK} />

        {/* крыша — длинный вагонный профиль */}
        <path d="M210,60 Q260,46 360,46 Q420,48 460,66 L450,98 L212,98 Z" {...zoneProps("roof")} />

        {/* лобовое (наклонное) */}
        <path d="M212,98 L274,98 L268,62 Q236,62 218,72 Z" {...zoneProps("windshield")} />
        {/* заднее стекло (универсал — почти вертикальное, длинное) */}
        <path d="M408,98 L450,98 L460,66 Q436,52 410,52 Z" {...zoneProps("rear_window")} />
        <g stroke={DIVIDER} strokeWidth="0.35" opacity="0.6">
          <line x1="416" y1="68" x2="448" y2="78" />
          <line x1="414" y1="78" x2="450" y2="86" />
          <line x1="412" y1="88" x2="450" y2="94" />
        </g>

        {/* боковые стёкла + B / C стойки */}
        <path d="M276,98 L406,98 L406,68 Q340,60 276,68 Z"
          fill={GLASS_TINT} stroke={OUTLINE} strokeWidth="0.6" opacity="0.7" />
        <line x1="318" y1="60" x2="318" y2="98" stroke={OUTLINE} strokeWidth="1.6" />
        <line x1="370" y1="60" x2="370" y2="98" stroke={OUTLINE} strokeWidth="1.6" />
        <line x1="276" y1="98" x2="406" y2="98" stroke={DIVIDER} strokeWidth="0.6" />

        {/* поясная (Audi tornado) линия */}
        <line x1="120" y1="158" x2="540" y2="158" stroke={DIVIDER} strokeWidth="0.5" strokeDasharray="3 3" />

        {/* длинный капот */}
        <path d="M118,114 L212,98 L212,160 L124,160 Z" {...zoneProps("hood")} />

        {/* переднее крыло + арка */}
        <path d="M62,170 Q52,134 96,114 L118,114 L124,160 L124,212 L42,212 Q42,188 62,170 Z M62,212 A40,40 0 0,1 144,212 Z"
          {...zoneProps(fender("front"))} fillRule="evenodd" />

        {/* передний бампер */}
        <path d="M28,184 L62,172 L62,218 L34,218 Q22,202 28,184 Z" {...zoneProps("fbumper")} />

        {/* фара Matrix LED */}
        <path d="M52,150 Q76,146 110,152 Q118,162 108,176 Q78,178 58,176 Q42,162 52,150 Z"
          fill={LAMP} stroke={OUTLINE} strokeWidth="0.7" strokeLinejoin="round" />
        <line x1="56" y1="158" x2="106" y2="158" stroke={OUTLINE} strokeWidth="0.5" opacity="0.5" />

        {/* двери */}
        <path d="M212,100 L318,100 L318,218 L222,218 Q212,206 212,184 Z" {...zoneProps(door("front"))} />
        <path d="M318,100 L406,100 L408,218 L318,218 Z" {...zoneProps(door("rear"))} />

        {/* ручки */}
        <rect x="244" y="142" width="26" height="4" rx="2" fill={OUTLINE} />
        <rect x="344" y="142" width="26" height="4" rx="2" fill={OUTLINE} />

        {/* порог + накладка allroad */}
        <path d="M222,218 L408,218 L406,232 L224,232 Z" {...zoneProps(thresh)} />
        <rect x="230" y="220" width="172" height="6" fill={CLADDING} opacity="0.55" />

        {/* заднее крыло + арка */}
        <path d="M406,100 L470,116 Q560,140 588,180 L588,218 L406,218 Z M488,212 A40,40 0 0,1 570,212 Z"
          {...zoneProps(fender("rear"))} fillRule="evenodd" />

        {/* крышка багажника (профиль) */}
        <path d="M406,100 L470,116 L470,160 L406,160 Z" {...zoneProps("trunk")} />

        {/* задний бампер */}
        <path d="M566,184 L602,170 Q610,200 600,218 L566,218 Z" {...zoneProps("rbumper")} />

        {/* задний фонарь */}
        <path d="M560,150 Q546,146 522,152 L522,176 Q546,178 562,176 Q572,162 560,150 Z"
          fill={TAIL} stroke={OUTLINE} strokeWidth="0.7" strokeLinejoin="round" />
        <line x1="526" y1="162" x2="560" y2="162" stroke="white" strokeWidth="0.6" opacity="0.6" />

        {/* allroad обвес арок */}
        <path d="M58,214 A48,48 0 0,1 148,214 L150,222 Q104,236 58,222 Z"
          fill={CLADDING} opacity="0.8" />
        <path d="M484,214 A48,48 0 0,1 574,214 L576,222 Q530,236 484,222 Z"
          fill={CLADDING} opacity="0.8" />

        {/* колёса — пятилучевые диски Audi */}
        {[104, 530].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={210} r="38" fill={DARK} />
            <circle cx={cx} cy={210} r="30" fill="oklch(0.18 0.005 250)" />
            <circle cx={cx} cy={210} r="22" fill="oklch(0.55 0.008 250)" />
            <circle cx={cx} cy={210} r="6" fill={DARK} stroke={GLASS_TINT} strokeWidth="0.6" />
            {[0, 72, 144, 216, 288].map((a) => {
              const rad = ((a - 90) * Math.PI) / 180;
              const x1 = cx + 7 * Math.cos(rad);
              const y1 = 210 + 7 * Math.sin(rad);
              const x2 = cx + 21 * Math.cos(rad);
              const y2 = 210 + 21 * Math.sin(rad);
              return (
                <line key={a} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={DARK} strokeWidth="4.5" strokeLinecap="round" />
              );
            })}
          </g>
        ))}

        {/* зеркало */}
        <path d="M214,98 L236,82 Q248,82 248,96 L236,110 L216,110 Z" fill={DARK} />

        {/* шильдик allroad */}
        <g opacity="0.7">
          <rect x="430" y="178" width="42" height="8" rx="1.5" fill="none" stroke={OUTLINE} strokeWidth="0.4" />
          <text x="451" y="184" textAnchor="middle" fontSize="6" fontFamily="ui-sans-serif, system-ui" fill={OUTLINE}>allroad</text>
        </g>
      </g>
    </svg>
  );
}
