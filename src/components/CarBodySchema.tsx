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
 * TOP VIEW — седан в стиле японского аукционного листа.
 * Силуэт перерисован вручную по референсу SVG Repo / integrity-exports.
 * viewBox 0 0 280 580 — узкий вертикальный кадр.
 * =================================================================== */
function TopView({ zoneProps }: { zoneProps: ZoneProps }) {
  return (
    <svg
      viewBox="0 0 280 580"
      className="w-full h-auto max-h-[520px] mx-auto block"
      role="img"
      aria-label="Вид сверху"
    >
      {/* base silhouette shadow */}
      <path
        d="M70,8 Q140,-4 210,8 Q244,18 252,60 L256,150 Q258,260 256,360 L252,520 Q244,562 210,572 Q140,584 70,572 Q36,562 28,520 L24,360 Q22,260 24,150 L28,60 Q36,18 70,8 Z"
        fill="white"
        stroke="oklch(0.82 0.005 250)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Front bumper */}
      <path
        d="M50,42 Q140,18 230,42 L226,72 Q140,52 54,72 Z"
        {...zoneProps("fbumper")}
      />

      {/* Front fenders */}
      <path
        d="M30,70 Q28,100 32,140 L62,140 L62,76 Q46,72 30,70 Z"
        {...zoneProps("flfender")}
      />
      <path
        d="M250,70 Q252,100 248,140 L218,140 L218,76 Q234,72 250,70 Z"
        {...zoneProps("frfender")}
      />

      {/* Hood — крупная панель с осевой линией */}
      <path
        d="M62,76 L218,76 L214,150 L66,150 Z"
        {...zoneProps("hood")}
      />
      <line x1="140" y1="80" x2="140" y2="148" stroke="oklch(0.82 0.005 250)" strokeWidth="0.6" strokeDasharray="2 3" />

      {/* Windshield — трапеция */}
      <path
        d="M66,152 L214,152 L198,200 L82,200 Z"
        {...zoneProps("windshield")}
      />

      {/* Roof + cabin */}
      <path
        d="M82,202 L198,202 L196,378 L84,378 Z"
        {...zoneProps("roof")}
      />
      {/* roof shine highlight */}
      <ellipse cx="140" cy="290" rx="34" ry="60" fill="white" opacity="0.35" />

      {/* Thresholds (sills) */}
      <path d="M32,202 L62,202 L62,378 L32,378 Z" {...zoneProps("lthresh")} />
      <path d="M218,202 L248,202 L248,378 L218,378 Z" {...zoneProps("rthresh")} />

      {/* Front doors */}
      <path d="M62,202 L82,202 L84,288 L62,288 Z" {...zoneProps("fldoor")} />
      <path d="M218,202 L198,202 L196,288 L218,288 Z" {...zoneProps("frdoor")} />

      {/* Rear doors */}
      <path d="M62,290 L84,290 L84,378 L62,378 Z" {...zoneProps("rldoor")} />
      <path d="M218,290 L196,290 L196,378 L218,378 Z" {...zoneProps("rrdoor")} />

      {/* Side mirrors */}
      <ellipse cx="26" cy="186" rx="8" ry="5" fill="oklch(0.55 0.01 250)" />
      <ellipse cx="254" cy="186" rx="8" ry="5" fill="oklch(0.55 0.01 250)" />

      {/* Rear fenders */}
      <path
        d="M30,378 L62,378 L62,442 Q46,440 32,438 Q28,408 30,378 Z"
        {...zoneProps("rlfender")}
      />
      <path
        d="M250,378 L218,378 L218,442 Q234,440 248,438 Q252,408 250,378 Z"
        {...zoneProps("rrfender")}
      />

      {/* Rear window */}
      <path d="M82,380 L198,380 L214,430 L66,430 Z" {...zoneProps("rear_window")} />

      {/* Trunk lid */}
      <path d="M66,432 L214,432 L218,510 L62,510 Z" {...zoneProps("trunk")} />
      <line x1="140" y1="438" x2="140" y2="506" stroke="oklch(0.82 0.005 250)" strokeWidth="0.6" strokeDasharray="2 3" />

      {/* Rear bumper */}
      <path d="M54,512 L226,512 L230,544 Q140,568 50,544 Z" {...zoneProps("rbumper")} />

      {/* tiny arrow indicating front */}
      <g opacity="0.5">
        <path d="M140,16 L146,28 L134,28 Z" fill="oklch(0.45 0.01 250)" />
        <text x="140" y="42" textAnchor="middle" fontSize="8" fill="oklch(0.45 0.01 250)" fontFamily="ui-sans-serif">
          ПЕРЕД
        </text>
      </g>
    </svg>
  );
}

/* ===================================================================
 * FRONT VIEW
 * =================================================================== */
function FrontView({ zoneProps }: { zoneProps: ZoneProps }) {
  return (
    <svg
      viewBox="0 0 420 300"
      className="w-full h-auto max-h-[440px] mx-auto block"
      role="img"
      aria-label="Вид спереди"
    >
      {/* Ground shadow */}
      <ellipse cx="210" cy="278" rx="180" ry="6" fill="oklch(0.85 0.005 250)" opacity="0.4" />

      {/* Roof — узкий верх */}
      <path
        d="M140,70 Q210,52 280,70 L264,108 Q210,96 156,108 Z"
        {...zoneProps("roof")}
      />

      {/* Pillars hint */}
      <line x1="148" y1="108" x2="156" y2="70" stroke="oklch(0.55 0.01 250)" strokeWidth="0.8" />
      <line x1="272" y1="108" x2="264" y2="70" stroke="oklch(0.55 0.01 250)" strokeWidth="0.8" />

      {/* Windshield */}
      <path
        d="M156,108 Q210,98 264,108 L252,148 Q210,140 168,148 Z"
        {...zoneProps("windshield")}
      />

      {/* Hood (top edge visible front-on) */}
      <path
        d="M84,150 Q124,144 168,148 L252,148 Q296,144 336,150 L324,184 Q210,172 96,184 Z"
        {...zoneProps("hood")}
      />

      {/* Side fenders (visible volumes) */}
      <path
        d="M40,212 Q44,170 84,150 L96,184 L70,232 Q52,232 40,228 Z"
        {...zoneProps("flfender")}
      />
      <path
        d="M380,212 Q376,170 336,150 L324,184 L350,232 Q368,232 380,228 Z"
        {...zoneProps("frfender")}
      />

      {/* Front bumper — большая сложная панель */}
      <path
        d="M44,222 L376,222 Q380,238 372,256 L60,256 Q40,238 44,222 Z"
        {...zoneProps("fbumper")}
      />

      {/* Grille */}
      <path
        d="M150,196 L270,196 Q280,210 270,220 L150,220 Q140,210 150,196 Z"
        fill="oklch(0.22 0.01 250)"
        stroke="oklch(0.45 0.01 250)"
        strokeWidth="0.6"
      />
      <line x1="150" y1="208" x2="270" y2="208" stroke="oklch(0.4 0.01 250)" strokeWidth="0.6" />

      {/* Manufacturer emblem hint */}
      <circle cx="210" cy="208" r="6" fill="oklch(0.85 0.005 250)" stroke="oklch(0.55 0.01 250)" strokeWidth="0.6" />

      {/* Headlights */}
      <path
        d="M70,192 Q92,186 134,192 Q142,200 134,212 Q92,210 72,210 Q64,202 70,192 Z"
        fill="oklch(0.96 0.025 90)"
        stroke="oklch(0.65 0.01 250)"
        strokeWidth="0.8"
      />
      <path
        d="M350,192 Q328,186 286,192 Q278,200 286,212 Q328,210 348,210 Q356,202 350,192 Z"
        fill="oklch(0.96 0.025 90)"
        stroke="oklch(0.65 0.01 250)"
        strokeWidth="0.8"
      />
      {/* DRL stripes */}
      <path d="M76,196 Q102,192 130,196" fill="none" stroke="oklch(0.85 0.02 90)" strokeWidth="1.2" />
      <path d="M344,196 Q318,192 290,196" fill="none" stroke="oklch(0.85 0.02 90)" strokeWidth="1.2" />

      {/* Fog lamps */}
      <circle cx="80" cy="244" r="6" fill="oklch(0.92 0.02 90)" stroke="oklch(0.6 0.01 250)" strokeWidth="0.6" />
      <circle cx="340" cy="244" r="6" fill="oklch(0.92 0.02 90)" stroke="oklch(0.6 0.01 250)" strokeWidth="0.6" />

      {/* License plate */}
      <rect x="180" y="230" width="60" height="18" rx="2" fill="white" stroke="oklch(0.55 0.01 250)" strokeWidth="0.6" />

      {/* Wheels (only arches visible) */}
      <path d="M44,256 Q40,272 56,272 L94,272 Q102,256 90,250" fill="oklch(0.22 0.01 250)" />
      <path d="M376,256 Q380,272 364,272 L326,272 Q318,256 330,250" fill="oklch(0.22 0.01 250)" />

      {/* Mirrors */}
      <ellipse cx="46" cy="148" rx="10" ry="6" fill="oklch(0.55 0.01 250)" />
      <ellipse cx="374" cy="148" rx="10" ry="6" fill="oklch(0.55 0.01 250)" />
    </svg>
  );
}

/* ===================================================================
 * REAR VIEW
 * =================================================================== */
function RearView({ zoneProps }: { zoneProps: ZoneProps }) {
  return (
    <svg
      viewBox="0 0 420 300"
      className="w-full h-auto max-h-[440px] mx-auto block"
      role="img"
      aria-label="Вид сзади"
    >
      <ellipse cx="210" cy="278" rx="180" ry="6" fill="oklch(0.85 0.005 250)" opacity="0.4" />

      <path
        d="M140,70 Q210,52 280,70 L268,104 Q210,94 152,104 Z"
        {...zoneProps("roof")}
      />

      <line x1="152" y1="104" x2="156" y2="70" stroke="oklch(0.55 0.01 250)" strokeWidth="0.8" />
      <line x1="268" y1="104" x2="264" y2="70" stroke="oklch(0.55 0.01 250)" strokeWidth="0.8" />

      {/* Rear window — крупное */}
      <path
        d="M152,104 Q210,96 268,104 L256,152 Q210,144 164,152 Z"
        {...zoneProps("rear_window")}
      />
      {/* heater lines */}
      <g stroke="oklch(0.75 0.01 250)" strokeWidth="0.5" opacity="0.7">
        <line x1="166" y1="118" x2="254" y2="118" />
        <line x1="166" y1="128" x2="254" y2="128" />
        <line x1="166" y1="138" x2="254" y2="138" />
      </g>

      {/* Trunk lid — большая панель */}
      <path
        d="M84,154 Q124,150 164,152 L256,152 Q296,150 336,154 L322,210 Q210,196 98,210 Z"
        {...zoneProps("trunk")}
      />

      {/* trunk handle / emblem */}
      <rect x="190" y="178" width="40" height="4" rx="2" fill="oklch(0.55 0.01 250)" />
      <circle cx="210" cy="168" r="5" fill="oklch(0.75 0.01 250)" stroke="oklch(0.55 0.01 250)" strokeWidth="0.5" />

      {/* Tail lights — широкие L-образные */}
      <path
        d="M60,154 L150,154 Q156,170 152,196 L66,196 Q56,180 60,154 Z"
        fill="color-mix(in oklab, var(--grade-bad) 55%, white)"
        stroke="oklch(0.55 0.01 250)"
        strokeWidth="0.6"
        opacity="0.85"
      />
      <path
        d="M360,154 L270,154 Q264,170 268,196 L354,196 Q364,180 360,154 Z"
        fill="color-mix(in oklab, var(--grade-bad) 55%, white)"
        stroke="oklch(0.55 0.01 250)"
        strokeWidth="0.6"
        opacity="0.85"
      />
      {/* tail light inner glow */}
      <path d="M68,162 L142,162 Q146,172 142,188 L72,188 Q66,176 68,162 Z" fill="white" opacity="0.35" />
      <path d="M352,162 L278,162 Q274,172 278,188 L348,188 Q354,176 352,162 Z" fill="white" opacity="0.35" />

      {/* Rear fenders (side volumes) */}
      <path
        d="M40,212 Q44,180 60,160 L66,196 L70,232 Q52,232 40,228 Z"
        {...zoneProps("rlfender")}
      />
      <path
        d="M380,212 Q376,180 360,160 L354,196 L350,232 Q368,232 380,228 Z"
        {...zoneProps("rrfender")}
      />

      {/* Rear bumper */}
      <path
        d="M44,222 L376,222 Q380,240 370,256 L60,256 Q40,240 44,222 Z"
        {...zoneProps("rbumper")}
      />

      {/* Reflectors */}
      <ellipse cx="80" cy="240" rx="10" ry="4" fill="color-mix(in oklab, var(--grade-bad) 60%, white)" opacity="0.7" />
      <ellipse cx="340" cy="240" rx="10" ry="4" fill="color-mix(in oklab, var(--grade-bad) 60%, white)" opacity="0.7" />

      {/* License plate */}
      <rect x="180" y="228" width="60" height="20" rx="2" fill="white" stroke="oklch(0.55 0.01 250)" strokeWidth="0.6" />
      {/* exhaust */}
      <ellipse cx="120" cy="258" rx="9" ry="3.5" fill="oklch(0.55 0.01 250)" />
      <ellipse cx="300" cy="258" rx="9" ry="3.5" fill="oklch(0.55 0.01 250)" />

      {/* Wheels arches */}
      <path d="M44,256 Q40,272 56,272 L94,272 Q102,256 90,250" fill="oklch(0.22 0.01 250)" />
      <path d="M376,256 Q380,272 364,272 L326,272 Q318,256 330,250" fill="oklch(0.22 0.01 250)" />
    </svg>
  );
}

/* ===================================================================
 * SIDE VIEW — единый компонент с зеркальным переключателем
 * =================================================================== */
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
      viewBox="0 0 600 260"
      className="w-full h-auto max-h-[380px] mx-auto block"
      role="img"
      aria-label={`Вид ${isLeft ? "слева" : "справа"}`}
    >
      <g transform={isLeft ? "" : "translate(600,0) scale(-1,1)"}>
        {/* shadow */}
        <ellipse cx="300" cy="240" rx="270" ry="6" fill="oklch(0.85 0.005 250)" opacity="0.4" />

        {/* Roof (greenhouse top) */}
        <path
          d="M195,52 Q230,38 290,36 Q360,36 400,58 L388,96 L200,96 Z"
          {...zoneProps("roof")}
        />

        {/* Windshield */}
        <path
          d="M200,96 L260,96 L256,58 Q230,58 215,68 Z"
          {...zoneProps("windshield")}
        />

        {/* Rear window */}
        <path
          d="M324,96 L388,96 L378,68 Q352,56 320,58 Z"
          {...zoneProps("rear_window")}
        />

        {/* Door windows (decorative side glass strip) */}
        <path
          d="M262,96 L322,96 L322,72 Q292,68 262,72 Z"
          fill="oklch(0.88 0.01 240)"
          stroke="oklch(0.6 0.01 250)"
          strokeWidth="0.6"
          opacity="0.65"
        />
        {/* B-pillar */}
        <line x1="292" y1="58" x2="292" y2="96" stroke="oklch(0.45 0.01 250)" strokeWidth="2" />

        {/* Belt line */}
        <line x1="200" y1="100" x2="400" y2="100" stroke="oklch(0.55 0.01 250)" strokeWidth="0.8" />

        {/* Hood */}
        <path
          d="M110,108 L200,98 L200,150 L116,150 Z"
          {...zoneProps("hood")}
        />

        {/* Front fender — с круглой аркой */}
        <path
          d="M60,160 Q50,130 90,108 L110,108 L116,150 L116,200 L40,200 Q40,178 60,160 Z M60,200 A38,38 0 0,1 136,200 Z"
          {...zoneProps(fender("front"))}
          fillRule="evenodd"
        />

        {/* Front bumper */}
        <path
          d="M30,180 L60,168 L60,210 L34,210 Q26,196 30,180 Z"
          {...zoneProps("fbumper")}
        />

        {/* Front door */}
        <path
          d="M200,100 L292,100 L292,210 L210,210 Q200,200 200,180 Z"
          {...zoneProps(door("front"))}
        />

        {/* Rear door */}
        <path
          d="M292,100 L388,100 L390,210 L292,210 Z"
          {...zoneProps(door("rear"))}
        />

        {/* Threshold (sill) */}
        <path
          d="M210,210 L390,210 L388,225 L212,225 Z"
          {...zoneProps(thresh)}
        />

        {/* Rear fender — с круглой аркой */}
        <path
          d="M388,108 L460,118 Q540,140 560,180 L560,210 L388,210 Z M464,200 A38,38 0 0,1 540,200 Z"
          {...zoneProps(fender("rear"))}
          fillRule="evenodd"
        />

        {/* Trunk lid (partial profile near rear) */}
        <path
          d="M388,100 L460,116 L460,150 L388,150 Z"
          {...zoneProps("trunk")}
        />

        {/* Rear bumper */}
        <path
          d="M540,180 L572,170 Q578,196 570,210 L540,210 Z"
          {...zoneProps("rbumper")}
        />

        {/* Wheel arches outline */}
        <circle cx="98" cy="200" r="38" fill="none" stroke="oklch(0.55 0.01 250)" strokeWidth="1" />
        <circle cx="502" cy="200" r="38" fill="none" stroke="oklch(0.55 0.01 250)" strokeWidth="1" />

        {/* Wheels (tire + rim + spokes) */}
        <g>
          <circle cx="98" cy="205" r="32" fill="oklch(0.18 0.005 250)" />
          <circle cx="98" cy="205" r="22" fill="oklch(0.45 0.01 250)" />
          <circle cx="98" cy="205" r="6" fill="oklch(0.7 0.005 250)" />
          {[0, 72, 144, 216, 288].map((a) => (
            <line
              key={a}
              x1="98"
              y1="205"
              x2={98 + 18 * Math.cos((a * Math.PI) / 180)}
              y2={205 + 18 * Math.sin((a * Math.PI) / 180)}
              stroke="oklch(0.25 0.005 250)"
              strokeWidth="2.5"
            />
          ))}
        </g>
        <g>
          <circle cx="502" cy="205" r="32" fill="oklch(0.18 0.005 250)" />
          <circle cx="502" cy="205" r="22" fill="oklch(0.45 0.01 250)" />
          <circle cx="502" cy="205" r="6" fill="oklch(0.7 0.005 250)" />
          {[0, 72, 144, 216, 288].map((a) => (
            <line
              key={a}
              x1="502"
              y1="205"
              x2={502 + 18 * Math.cos((a * Math.PI) / 180)}
              y2={205 + 18 * Math.sin((a * Math.PI) / 180)}
              stroke="oklch(0.25 0.005 250)"
              strokeWidth="2.5"
            />
          ))}
        </g>

        {/* Door handles */}
        <rect x="232" y="140" width="22" height="5" rx="2" fill="oklch(0.5 0.01 250)" />
        <rect x="332" y="140" width="22" height="5" rx="2" fill="oklch(0.5 0.01 250)" />

        {/* Mirror */}
        <path d="M200,98 L218,82 Q228,82 228,94 L218,108 L202,108 Z" fill="oklch(0.5 0.01 250)" />

        {/* Headlight */}
        <path
          d="M52,148 Q72,142 100,148 Q108,156 100,170 Q72,172 56,170 Q44,160 52,148 Z"
          fill="oklch(0.96 0.025 90)"
          stroke="oklch(0.6 0.01 250)"
          strokeWidth="0.6"
        />
        {/* Taillight */}
        <path
          d="M548,148 Q536,144 516,150 L516,172 Q536,174 548,172 Q558,160 548,148 Z"
          fill="color-mix(in oklab, var(--grade-bad) 55%, white)"
          stroke="oklch(0.6 0.01 250)"
          strokeWidth="0.6"
          opacity="0.85"
        />

        {/* Front indicator */}
        <text
          x="300"
          y="20"
          textAnchor="middle"
          fontSize="9"
          fontFamily="ui-sans-serif"
          fill="oklch(0.5 0.01 250)"
          opacity="0.6"
        >
          {isLeft ? "ЛЕВАЯ СТОРОНА" : "ПРАВАЯ СТОРОНА"}
        </text>
      </g>
    </svg>
  );
}
