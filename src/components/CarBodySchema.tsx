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
  if (s === "serious") return "color-mix(in oklab, var(--grade-bad) 55%, white)";
  if (s === "minor") return "color-mix(in oklab, var(--grade-warn) 60%, white)";
  if (s === "ok") return "color-mix(in oklab, var(--grade-good) 28%, white)";
  return "oklch(0.97 0.003 250)";
}
function strokeFor(s: Status, hovered: boolean) {
  if (hovered) return "var(--accent)";
  if (s === "serious") return "var(--grade-bad)";
  if (s === "minor") return "var(--grade-warn)";
  if (s === "ok") return "var(--grade-good)";
  return "oklch(0.82 0.005 250)";
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
      strokeWidth: isHover ? 2.5 : 1.5,
      style: { cursor: hasEl ? "pointer" : "default", transition: "all 120ms ease" },
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
        <div className="relative rounded-lg p-2" style={{ background: "oklch(0.985 0.003 250)" }}>
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
  style: React.CSSProperties;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
};

function TopView({ zoneProps }: { zoneProps: ZoneProps }) {
  return (
    <svg viewBox="0 0 260 520" className="w-full h-auto max-h-[500px] mx-auto block">
      <rect x="30" y="10" width="200" height="500" rx="70" ry="90"
        fill="white" stroke="oklch(0.85 0.005 250)" strokeWidth="1" />
      {/* Front bumper */}
      <path d="M50,30 Q130,5 210,30 L205,55 Q130,42 55,55 Z" {...zoneProps("fbumper")} />
      {/* Hood */}
      <rect x="60" y="60" width="140" height="75" rx="6" {...zoneProps("hood")} />
      {/* Front fenders */}
      <path d="M30,65 L60,65 L60,140 L34,140 Z" {...zoneProps("flfender")} />
      <path d="M230,65 L200,65 L200,140 L226,140 Z" {...zoneProps("frfender")} />
      {/* Windshield */}
      <path d="M65,140 L195,140 L182,180 L78,180 Z" {...zoneProps("windshield")} />
      {/* Front doors */}
      <rect x="38" y="185" width="44" height="80" {...zoneProps("fldoor")} />
      <rect x="178" y="185" width="44" height="80" {...zoneProps("frdoor")} />
      {/* Rear doors */}
      <rect x="38" y="268" width="44" height="80" {...zoneProps("rldoor")} />
      <rect x="178" y="268" width="44" height="80" {...zoneProps("rrdoor")} />
      {/* Thresholds */}
      <rect x="32" y="185" width="6" height="163" {...zoneProps("lthresh")} />
      <rect x="222" y="185" width="6" height="163" {...zoneProps("rthresh")} />
      {/* Roof */}
      <rect x="85" y="185" width="90" height="163" rx="4" {...zoneProps("roof")} />
      <circle cx="130" cy="215" r="3" fill="oklch(0.85 0.005 250)" />
      {/* Rear fenders */}
      <path d="M30,353 L60,353 L60,425 L34,425 Z" {...zoneProps("rlfender")} />
      <path d="M230,353 L200,353 L200,425 L226,425 Z" {...zoneProps("rrfender")} />
      {/* Rear window */}
      <path d="M78,353 L182,353 L195,392 L65,392 Z" {...zoneProps("rear_window")} />
      {/* Trunk */}
      <rect x="60" y="397" width="140" height="75" rx="6" {...zoneProps("trunk")} />
      {/* Rear bumper */}
      <path d="M50,495 Q130,520 210,495 L205,470 Q130,483 55,470 Z" {...zoneProps("rbumper")} />
      <polygon points="130,18 137,30 123,30" fill="oklch(0.6 0.01 250)" opacity="0.4" />
    </svg>
  );
}

function FrontView({ zoneProps }: { zoneProps: ZoneProps }) {
  return (
    <svg viewBox="0 0 400 280" className="w-full h-auto max-h-[420px] mx-auto block">
      {/* Body silhouette */}
      <path d="M40,210 Q40,140 80,110 L130,75 Q200,55 270,75 L320,110 Q360,140 360,210 L360,235 L40,235 Z"
        fill="white" stroke="oklch(0.85 0.005 250)" strokeWidth="1" />
      {/* Roof */}
      <path d="M130,75 Q200,55 270,75 L260,108 Q200,95 140,108 Z" {...zoneProps("roof")} />
      {/* Windshield */}
      <path d="M138,110 Q200,98 262,110 L250,148 Q200,140 150,148 Z" {...zoneProps("windshield")} />
      {/* Hood (front view shows top edge) */}
      <path d="M80,148 L320,148 L310,180 L90,180 Z" {...zoneProps("hood")} />
      {/* Front bumper */}
      <path d="M50,200 L350,200 L345,232 Q200,222 55,232 Z" {...zoneProps("fbumper")} />
      {/* Headlights */}
      <ellipse cx="80" cy="178" rx="22" ry="9" fill="oklch(0.95 0.02 90)" stroke="oklch(0.75 0.01 250)" strokeWidth="0.8" />
      <ellipse cx="320" cy="178" rx="22" ry="9" fill="oklch(0.95 0.02 90)" stroke="oklch(0.75 0.01 250)" strokeWidth="0.8" />
      {/* Grille */}
      <rect x="170" y="195" width="60" height="14" rx="2" fill="oklch(0.4 0.01 250)" opacity="0.5" />
      {/* Fenders sides */}
      <path d="M40,210 L40,235 L75,235 L75,200 Z" {...zoneProps("flfender")} />
      <path d="M360,210 L360,235 L325,235 L325,200 Z" {...zoneProps("frfender")} />
      {/* Wheels */}
      <circle cx="80" cy="245" r="22" fill="oklch(0.25 0.01 250)" />
      <circle cx="320" cy="245" r="22" fill="oklch(0.25 0.01 250)" />
      <circle cx="80" cy="245" r="10" fill="oklch(0.55 0.01 250)" />
      <circle cx="320" cy="245" r="10" fill="oklch(0.55 0.01 250)" />
    </svg>
  );
}

function RearView({ zoneProps }: { zoneProps: ZoneProps }) {
  return (
    <svg viewBox="0 0 400 280" className="w-full h-auto max-h-[420px] mx-auto block">
      <path d="M40,210 Q40,140 80,110 L130,75 Q200,55 270,75 L320,110 Q360,140 360,210 L360,235 L40,235 Z"
        fill="white" stroke="oklch(0.85 0.005 250)" strokeWidth="1" />
      <path d="M130,75 Q200,55 270,75 L260,108 Q200,95 140,108 Z" {...zoneProps("roof")} />
      {/* Rear window */}
      <path d="M138,110 Q200,98 262,110 L250,148 Q200,140 150,148 Z" {...zoneProps("rear_window")} />
      {/* Trunk lid */}
      <path d="M80,148 L320,148 L310,180 L90,180 Z" {...zoneProps("trunk")} />
      {/* Rear bumper */}
      <path d="M50,200 L350,200 L345,232 Q200,222 55,232 Z" {...zoneProps("rbumper")} />
      {/* Tail lights */}
      <path d="M58,170 L120,170 L116,192 L60,192 Z" fill="color-mix(in oklab, var(--grade-bad) 70%, white)" opacity="0.7" stroke="oklch(0.75 0.01 250)" strokeWidth="0.8" />
      <path d="M342,170 L280,170 L284,192 L340,192 Z" fill="color-mix(in oklab, var(--grade-bad) 70%, white)" opacity="0.7" stroke="oklch(0.75 0.01 250)" strokeWidth="0.8" />
      {/* License plate */}
      <rect x="165" y="200" width="70" height="18" rx="2" fill="white" stroke="oklch(0.6 0.01 250)" strokeWidth="0.8" />
      {/* Rear fenders */}
      <path d="M40,210 L40,235 L75,235 L75,200 Z" {...zoneProps("rlfender")} />
      <path d="M360,210 L360,235 L325,235 L325,200 Z" {...zoneProps("rrfender")} />
      <circle cx="80" cy="245" r="22" fill="oklch(0.25 0.01 250)" />
      <circle cx="320" cy="245" r="22" fill="oklch(0.25 0.01 250)" />
      <circle cx="80" cy="245" r="10" fill="oklch(0.55 0.01 250)" />
      <circle cx="320" cy="245" r="10" fill="oklch(0.55 0.01 250)" />
    </svg>
  );
}

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

  // For right side, mirror by flipping the group
  return (
    <svg viewBox="0 0 540 240" className="w-full h-auto max-h-[360px] mx-auto block">
      <g transform={isLeft ? "" : "translate(540,0) scale(-1,1)"}>
        {/* Underline body shape */}
        <path
          d="M30,175 Q40,110 110,90 L180,55 Q260,40 360,55 L450,90 Q510,105 510,175 L510,195 L30,195 Z"
          fill="white" stroke="oklch(0.85 0.005 250)" strokeWidth="1"
        />
        {/* Roof */}
        <path d="M180,55 Q260,40 360,55 L370,90 L185,90 Z" {...zoneProps("roof")} />
        {/* Front windshield */}
        <path d="M185,90 L260,90 L250,55 Q220,52 195,62 Z" {...zoneProps("windshield")} />
        {/* Rear window */}
        <path d="M295,90 L370,90 L355,62 Q325,52 305,55 Z" {...zoneProps("rear_window")} />
        {/* Door windows region (decorative) */}
        <rect x="195" y="92" width="170" height="3" fill="oklch(0.75 0.01 250)" opacity="0.6" />
        {/* Hood */}
        <path d="M110,90 L185,90 L195,140 L110,140 Z" {...zoneProps("hood")} />
        {/* Front fender */}
        <path d="M55,140 L110,140 L110,180 L40,180 Q40,158 55,140 Z" {...zoneProps(fender("front"))} />
        {/* Front bumper */}
        <path d="M30,170 L55,170 L55,195 L30,195 Z" {...zoneProps("fbumper")} />
        {/* Front door */}
        <rect x="195" y="95" width="95" height="90" {...zoneProps(door("front"))} />
        {/* Rear door */}
        <rect x="290" y="95" width="90" height="90" {...zoneProps(door("rear"))} />
        {/* Threshold */}
        <rect x="195" y="180" width="185" height="10" {...zoneProps(thresh)} />
        {/* Rear fender */}
        <path d="M380,140 L450,140 L490,170 L490,190 L380,190 Z" {...zoneProps(fender("rear"))} />
        {/* Trunk */}
        <path d="M380,95 L380,140 L450,140 L440,95 Z" {...zoneProps("trunk")} />
        {/* Rear bumper */}
        <path d="M490,170 L510,170 L510,195 L490,195 Z" {...zoneProps("rbumper")} />
        {/* Wheel arches */}
        <circle cx="115" cy="195" r="38" fill="white" stroke="oklch(0.85 0.005 250)" strokeWidth="1" />
        <circle cx="425" cy="195" r="38" fill="white" stroke="oklch(0.85 0.005 250)" strokeWidth="1" />
        {/* Wheels */}
        <circle cx="115" cy="200" r="30" fill="oklch(0.22 0.01 250)" />
        <circle cx="425" cy="200" r="30" fill="oklch(0.22 0.01 250)" />
        <circle cx="115" cy="200" r="13" fill="oklch(0.55 0.01 250)" />
        <circle cx="425" cy="200" r="13" fill="oklch(0.55 0.01 250)" />
        {/* Door handles */}
        <rect x="220" y="130" width="14" height="3" rx="1" fill="oklch(0.55 0.01 250)" />
        <rect x="315" y="130" width="14" height="3" rx="1" fill="oklch(0.55 0.01 250)" />
        {/* Headlight hint */}
        <ellipse cx="50" cy="155" rx="10" ry="6" fill="oklch(0.95 0.02 90)" stroke="oklch(0.75 0.01 250)" strokeWidth="0.6" />
      </g>
    </svg>
  );
}
