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
 * Иконки кузова — единый минималистичный стиль (auction-sheet style).
 * Тонкий контур, плоские панели, без декоративных бликов.
 * =================================================================== */

const OUTLINE = "oklch(0.55 0.012 250)";
const DIVIDER = "oklch(0.7 0.008 250)";
const GLASS_TINT = "oklch(0.92 0.012 235)";
const DARK = "oklch(0.28 0.012 250)";
const LAMP = "oklch(0.94 0.03 95)";

/* ---------------- TOP ---------------- */
function TopView({ zoneProps }: { zoneProps: ZoneProps }) {
  return (
    <svg
      viewBox="0 0 260 600"
      className="w-full h-auto max-h-[520px] mx-auto block"
      role="img"
      aria-label="Вид сверху"
    >
      {/* силуэт-тень */}
      <path
        d="M60,30 Q130,8 200,30 Q236,42 240,90 L242,520 Q236,572 200,584 Q130,602 60,584 Q24,572 18,520 L20,90 Q24,42 60,30 Z"
        fill="white" stroke={OUTLINE} strokeWidth="1.4" strokeLinejoin="round"
      />

      {/* передний бампер */}
      <path d="M42,58 Q130,38 218,58 L216,86 Q130,70 44,86 Z" {...zoneProps("fbumper")} />
      {/* крылья */}
      <path d="M22,86 L60,86 L60,160 L22,160 Q18,124 22,86 Z" {...zoneProps("flfender")} />
      <path d="M238,86 L200,86 L200,160 L238,160 Q242,124 238,86 Z" {...zoneProps("frfender")} />
      {/* капот */}
      <path d="M60,86 L200,86 L200,170 L60,170 Z" {...zoneProps("hood")} />
      <line x1="130" y1="92" x2="130" y2="166" stroke={DIVIDER} strokeWidth="0.6" strokeDasharray="3 3" />

      {/* лобовое */}
      <path d="M60,170 L200,170 L186,222 L74,222 Z" {...zoneProps("windshield")} />

      {/* крыша */}
      <path d="M74,222 L186,222 L186,400 L74,400 Z" {...zoneProps("roof")} />

      {/* пороги */}
      <path d="M22,222 L60,222 L60,400 L22,400 Z" {...zoneProps("lthresh")} />
      <path d="M238,222 L200,222 L200,400 L238,400 Z" {...zoneProps("rthresh")} />

      {/* двери — двумя строками */}
      <path d="M60,222 L74,222 L74,310 L60,310 Z" {...zoneProps("fldoor")} />
      <path d="M200,222 L186,222 L186,310 L200,310 Z" {...zoneProps("frdoor")} />
      <path d="M60,312 L74,312 L74,400 L60,400 Z" {...zoneProps("rldoor")} />
      <path d="M200,312 L186,312 L186,400 L200,400 Z" {...zoneProps("rrdoor")} />

      {/* стойки */}
      <line x1="74" y1="311" x2="186" y2="311" stroke={DIVIDER} strokeWidth="0.6" />

      {/* зеркала */}
      <ellipse cx="14" cy="206" rx="7" ry="4" fill={DARK} />
      <ellipse cx="246" cy="206" rx="7" ry="4" fill={DARK} />

      {/* задние крылья */}
      <path d="M22,400 L60,400 L60,470 Q40,468 22,464 Q18,432 22,400 Z" {...zoneProps("rlfender")} />
      <path d="M238,400 L200,400 L200,470 Q220,468 238,464 Q242,432 238,400 Z" {...zoneProps("rrfender")} />

      {/* заднее стекло */}
      <path d="M74,402 L186,402 L200,452 L60,452 Z" {...zoneProps("rear_window")} />

      {/* крышка багажника */}
      <path d="M60,454 L200,454 L200,530 L60,530 Z" {...zoneProps("trunk")} />
      <line x1="130" y1="460" x2="130" y2="526" stroke={DIVIDER} strokeWidth="0.6" strokeDasharray="3 3" />

      {/* задний бампер */}
      <path d="M44,532 L216,532 L218,562 Q130,582 42,562 Z" {...zoneProps("rbumper")} />

      {/* указатель «перёд» */}
      <g opacity="0.55">
        <path d="M130,16 L136,28 L124,28 Z" fill={OUTLINE} />
      </g>
    </svg>
  );
}

/* ---------------- FRONT ---------------- */
function FrontView({ zoneProps }: { zoneProps: ZoneProps }) {
  return (
    <svg
      viewBox="0 0 420 280"
      className="w-full h-auto max-h-[420px] mx-auto block"
      role="img"
      aria-label="Вид спереди"
    >
      <ellipse cx="210" cy="262" rx="180" ry="5" fill={OUTLINE} opacity="0.25" />

      {/* крыша */}
      <path d="M150,60 Q210,46 270,60 L260,96 Q210,86 160,96 Z" {...zoneProps("roof")} />
      {/* лобовое */}
      <path d="M160,96 Q210,88 260,96 L250,138 Q210,128 170,138 Z" {...zoneProps("windshield")} />
      {/* стойки */}
      <line x1="160" y1="96" x2="150" y2="60" stroke={DIVIDER} strokeWidth="0.8" />
      <line x1="260" y1="96" x2="270" y2="60" stroke={DIVIDER} strokeWidth="0.8" />

      {/* капот */}
      <path d="M86,140 Q126,134 170,138 L250,138 Q294,134 334,140 L322,174 Q210,162 98,174 Z" {...zoneProps("hood")} />

      {/* боковые крылья */}
      <path d="M40,210 Q44,170 86,140 L98,174 L74,224 Q54,224 40,220 Z" {...zoneProps("flfender")} />
      <path d="M380,210 Q376,170 334,140 L322,174 L346,224 Q366,224 380,220 Z" {...zoneProps("frfender")} />

      {/* бампер */}
      <path d="M44,212 L376,212 Q380,228 372,246 L48,246 Q40,228 44,212 Z" {...zoneProps("fbumper")} />

      {/* решётка */}
      <rect x="160" y="190" width="100" height="22" rx="3" fill={DARK} />
      <line x1="160" y1="201" x2="260" y2="201" stroke={OUTLINE} opacity="0.4" />
      <circle cx="210" cy="201" r="5" fill={GLASS_TINT} stroke={OUTLINE} strokeWidth="0.6" />

      {/* фары */}
      <path d="M78,186 Q102,182 142,188 Q150,198 142,208 Q102,208 80,206 Q70,196 78,186 Z"
        fill={LAMP} stroke={OUTLINE} strokeWidth="0.8" />
      <path d="M342,186 Q318,182 278,188 Q270,198 278,208 Q318,208 340,206 Q350,196 342,186 Z"
        fill={LAMP} stroke={OUTLINE} strokeWidth="0.8" />

      {/* номерной знак */}
      <rect x="184" y="222" width="52" height="16" rx="2" fill="white" stroke={OUTLINE} strokeWidth="0.6" />

      {/* арки колёс */}
      <path d="M44,246 Q40,262 56,262 L94,262 Q102,246 90,240" fill={DARK} />
      <path d="M376,246 Q380,262 364,262 L326,262 Q318,246 330,240" fill={DARK} />

      {/* зеркала */}
      <ellipse cx="48" cy="138" rx="9" ry="5" fill={DARK} />
      <ellipse cx="372" cy="138" rx="9" ry="5" fill={DARK} />
    </svg>
  );
}

/* ---------------- REAR ---------------- */
function RearView({ zoneProps }: { zoneProps: ZoneProps }) {
  return (
    <svg
      viewBox="0 0 420 280"
      className="w-full h-auto max-h-[420px] mx-auto block"
      role="img"
      aria-label="Вид сзади"
    >
      <ellipse cx="210" cy="262" rx="180" ry="5" fill={OUTLINE} opacity="0.25" />

      <path d="M150,60 Q210,46 270,60 L260,94 Q210,84 160,94 Z" {...zoneProps("roof")} />
      <line x1="160" y1="94" x2="150" y2="60" stroke={DIVIDER} strokeWidth="0.8" />
      <line x1="260" y1="94" x2="270" y2="60" stroke={DIVIDER} strokeWidth="0.8" />

      {/* заднее стекло */}
      <path d="M160,94 Q210,86 260,94 L250,142 Q210,132 170,142 Z" {...zoneProps("rear_window")} />
      <g stroke={DIVIDER} strokeWidth="0.4" opacity="0.7">
        <line x1="172" y1="108" x2="248" y2="108" />
        <line x1="172" y1="118" x2="248" y2="118" />
        <line x1="172" y1="128" x2="248" y2="128" />
      </g>

      {/* крышка багажника */}
      <path d="M86,144 Q126,140 170,142 L250,142 Q294,140 334,144 L322,200 Q210,188 98,200 Z" {...zoneProps("trunk")} />
      <rect x="192" y="170" width="36" height="3" rx="1.5" fill={DARK} />
      <circle cx="210" cy="160" r="4.5" fill={GLASS_TINT} stroke={OUTLINE} strokeWidth="0.5" />

      {/* фонари */}
      <path d="M62,144 L150,144 Q156,160 152,186 L66,186 Q56,170 62,144 Z"
        fill="color-mix(in oklab, var(--grade-bad) 50%, white)" stroke={OUTLINE} strokeWidth="0.6" />
      <path d="M358,144 L270,144 Q264,160 268,186 L354,186 Q364,170 358,144 Z"
        fill="color-mix(in oklab, var(--grade-bad) 50%, white)" stroke={OUTLINE} strokeWidth="0.6" />

      {/* задние крылья */}
      <path d="M40,210 Q44,176 62,150 L66,186 L74,224 Q54,224 40,220 Z" {...zoneProps("rlfender")} />
      <path d="M380,210 Q376,176 358,150 L354,186 L346,224 Q366,224 380,220 Z" {...zoneProps("rrfender")} />

      {/* бампер */}
      <path d="M44,212 L376,212 Q380,230 370,246 L48,246 Q40,230 44,212 Z" {...zoneProps("rbumper")} />

      {/* номер + выхлоп */}
      <rect x="184" y="218" width="52" height="18" rx="2" fill="white" stroke={OUTLINE} strokeWidth="0.6" />
      <ellipse cx="120" cy="248" rx="8" ry="3" fill={DARK} />
      <ellipse cx="300" cy="248" rx="8" ry="3" fill={DARK} />

      <path d="M44,246 Q40,262 56,262 L94,262 Q102,246 90,240" fill={DARK} />
      <path d="M376,246 Q380,262 364,262 L326,262 Q318,246 330,240" fill={DARK} />
    </svg>
  );
}

/* ---------------- SIDE ---------------- */
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
      viewBox="0 0 600 240"
      className="w-full h-auto max-h-[360px] mx-auto block"
      role="img"
      aria-label={`Вид ${isLeft ? "слева" : "справа"}`}
    >
      <g transform={isLeft ? "" : "translate(600,0) scale(-1,1)"}>
        <ellipse cx="300" cy="222" rx="270" ry="5" fill={OUTLINE} opacity="0.25" />

        {/* greenhouse */}
        <path d="M195,46 Q235,30 300,30 Q360,30 398,52 L388,90 L200,90 Z" {...zoneProps("roof")} />
        <path d="M200,90 L260,90 L256,52 Q230,52 215,62 Z" {...zoneProps("windshield")} />
        <path d="M324,90 L388,90 L378,62 Q352,52 320,52 Z" {...zoneProps("rear_window")} />

        {/* боковые стёкла + B-стойка */}
        <path d="M262,90 L322,90 L322,66 Q292,62 262,66 Z"
          fill={GLASS_TINT} stroke={OUTLINE} strokeWidth="0.6" opacity="0.7" />
        <line x1="292" y1="52" x2="292" y2="90" stroke={OUTLINE} strokeWidth="1.6" />

        {/* поясная линия */}
        <line x1="200" y1="94" x2="400" y2="94" stroke={DIVIDER} strokeWidth="0.6" />

        {/* капот */}
        <path d="M110,104 L200,94 L200,150 L116,150 Z" {...zoneProps("hood")} />

        {/* переднее крыло (с аркой) */}
        <path d="M60,160 Q50,128 90,104 L110,104 L116,150 L116,200 L40,200 Q40,178 60,160 Z M60,200 A38,38 0 0,1 136,200 Z"
          {...zoneProps(fender("front"))} fillRule="evenodd" />

        {/* передний бампер */}
        <path d="M30,178 L60,166 L60,208 L34,208 Q26,194 30,178 Z" {...zoneProps("fbumper")} />

        {/* двери */}
        <path d="M200,96 L292,96 L292,208 L210,208 Q200,198 200,178 Z" {...zoneProps(door("front"))} />
        <path d="M292,96 L388,96 L390,208 L292,208 Z" {...zoneProps(door("rear"))} />

        {/* порог */}
        <path d="M210,208 L390,208 L388,222 L212,222 Z" {...zoneProps(thresh)} />

        {/* заднее крыло (с аркой) */}
        <path d="M388,108 L460,118 Q540,140 560,180 L560,208 L388,208 Z M464,200 A38,38 0 0,1 540,200 Z"
          {...zoneProps(fender("rear"))} fillRule="evenodd" />

        {/* крышка багажника (часть профиля) */}
        <path d="M388,96 L460,114 L460,150 L388,150 Z" {...zoneProps("trunk")} />

        {/* задний бампер */}
        <path d="M540,178 L572,168 Q578,194 570,208 L540,208 Z" {...zoneProps("rbumper")} />

        {/* арки + колёса */}
        {[98, 502].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={200} r="36" fill={DARK} />
            <circle cx={cx} cy={200} r="22" fill="oklch(0.42 0.01 250)" />
            <circle cx={cx} cy={200} r="5" fill={GLASS_TINT} />
            {[0, 72, 144, 216, 288].map((a) => (
              <line key={a}
                x1={cx} y1="200"
                x2={cx + 18 * Math.cos((a * Math.PI) / 180)}
                y2={200 + 18 * Math.sin((a * Math.PI) / 180)}
                stroke={DARK} strokeWidth="2.5" />
            ))}
          </g>
        ))}

        {/* ручки */}
        <rect x="232" y="138" width="22" height="4" rx="2" fill={OUTLINE} />
        <rect x="332" y="138" width="22" height="4" rx="2" fill={OUTLINE} />

        {/* зеркало */}
        <path d="M200,94 L218,80 Q228,80 228,92 L218,104 L202,104 Z" fill={DARK} />

        {/* фара / фонарь */}
        <path d="M52,144 Q72,140 100,146 Q108,154 100,168 Q72,170 56,168 Q44,156 52,144 Z"
          fill={LAMP} stroke={OUTLINE} strokeWidth="0.6" />
        <path d="M548,144 Q536,140 516,148 L516,170 Q536,172 548,170 Q558,156 548,144 Z"
          fill="color-mix(in oklab, var(--grade-bad) 50%, white)" stroke={OUTLINE} strokeWidth="0.6" />
      </g>
    </svg>
  );
}
