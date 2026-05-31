import type { InspectionElement } from "@/lib/report.functions";

// Map of element slugs to SVG zone IDs
const ZONE_FOR_ELEMENT: Record<string, string> = {
  hood: "hood",
  roof: "roof",
  trunk: "trunk",
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
};

type ZoneStatus = "ok" | "minor" | "serious" | "unknown";

function colorFor(status: ZoneStatus, alpha = 1) {
  const base =
    status === "serious" ? "var(--grade-bad)" :
    status === "minor" ? "var(--grade-warn)" :
    status === "ok" ? "var(--grade-good)" :
    "var(--muted-foreground)";
  if (alpha === 1) return base;
  return `color-mix(in oklab, ${base} ${Math.round(alpha * 100)}%, transparent)`;
}

export function CarDiagram({ elements }: { elements: InspectionElement[] }) {
  const zoneStatus = new Map<string, ZoneStatus>();
  for (const el of elements) {
    const zone = ZONE_FOR_ELEMENT[el.elementType];
    if (!zone) continue;
    const cur = zoneStatus.get(zone);
    const st: ZoneStatus = el.seriousDamageTags.length > 0
      ? "serious"
      : !el.noDamage || el.noSeriousDamageTags.length > 0
        ? "minor"
        : "ok";
    if (!cur || rank(st) > rank(cur)) zoneStatus.set(zone, st);
  }
  const get = (id: string): ZoneStatus => zoneStatus.get(id) ?? "unknown";
  const fill = (id: string) => colorFor(get(id), 0.35);
  const stroke = (id: string) => colorFor(get(id), 1);

  return (
    <div className="w-full">
      <svg viewBox="0 0 320 600" className="w-full h-auto max-h-[520px] mx-auto block">
        {/* Outer body silhouette */}
        <rect x="40" y="20" width="240" height="560" rx="80" ry="100"
          fill="color-mix(in oklab, var(--paper-edge) 25%, transparent)"
          stroke="var(--ink)" strokeWidth="1.5" />

        {/* Front bumper */}
        <path d="M60,40 Q160,10 260,40 L255,70 Q160,55 65,70 Z"
          fill={fill("fbumper")} stroke={stroke("fbumper")} strokeWidth="1.5" />
        {/* Hood */}
        <rect x="75" y="75" width="170" height="80" rx="6"
          fill={fill("hood")} stroke={stroke("hood")} strokeWidth="1.5" />
        {/* Windshield */}
        <path d="M80,160 L240,160 L225,200 L95,200 Z"
          fill="color-mix(in oklab, var(--ink) 8%, transparent)" stroke="var(--ink)" strokeWidth="1" />
        {/* Front fenders */}
        <path d="M40,80 L75,80 L75,160 L45,160 Z"
          fill={fill("flfender")} stroke={stroke("flfender")} strokeWidth="1.5" />
        <path d="M280,80 L245,80 L245,160 L275,160 Z"
          fill={fill("frfender")} stroke={stroke("frfender")} strokeWidth="1.5" />
        {/* Front doors */}
        <rect x="50" y="205" width="50" height="90"
          fill={fill("fldoor")} stroke={stroke("fldoor")} strokeWidth="1.5" />
        <rect x="220" y="205" width="50" height="90"
          fill={fill("frdoor")} stroke={stroke("frdoor")} strokeWidth="1.5" />
        {/* Rear doors */}
        <rect x="50" y="300" width="50" height="90"
          fill={fill("rldoor")} stroke={stroke("rldoor")} strokeWidth="1.5" />
        <rect x="220" y="300" width="50" height="90"
          fill={fill("rrdoor")} stroke={stroke("rrdoor")} strokeWidth="1.5" />
        {/* Roof */}
        <rect x="100" y="205" width="120" height="185" rx="4"
          fill={fill("roof")} stroke={stroke("roof")} strokeWidth="1.5" />
        {/* Thresholds */}
        <rect x="42" y="205" width="8" height="185"
          fill={fill("lthresh")} stroke={stroke("lthresh")} strokeWidth="1" />
        <rect x="270" y="205" width="8" height="185"
          fill={fill("rthresh")} stroke={stroke("rthresh")} strokeWidth="1" />
        {/* Rear fenders */}
        <path d="M40,395 L75,395 L75,475 L45,475 Z"
          fill={fill("rlfender")} stroke={stroke("rlfender")} strokeWidth="1.5" />
        <path d="M280,395 L245,395 L245,475 L275,475 Z"
          fill={fill("rrfender")} stroke={stroke("rrfender")} strokeWidth="1.5" />
        {/* Rear window */}
        <path d="M95,395 L225,395 L240,435 L80,435 Z"
          fill="color-mix(in oklab, var(--ink) 8%, transparent)" stroke="var(--ink)" strokeWidth="1" />
        {/* Trunk */}
        <rect x="75" y="440" width="170" height="80" rx="6"
          fill={fill("trunk")} stroke={stroke("trunk")} strokeWidth="1.5" />
        {/* Rear bumper */}
        <path d="M60,560 Q160,590 260,560 L255,530 Q160,545 65,530 Z"
          fill={fill("rbumper")} stroke={stroke("rbumper")} strokeWidth="1.5" />

        {/* Direction marker */}
        <g transform="translate(160, 30)">
          <polygon points="0,-6 6,4 -6,4" fill="var(--ink)" opacity="0.4" />
        </g>
      </svg>
    </div>
  );
}

function rank(s: ZoneStatus): number {
  return s === "serious" ? 3 : s === "minor" ? 2 : s === "ok" ? 1 : 0;
}
