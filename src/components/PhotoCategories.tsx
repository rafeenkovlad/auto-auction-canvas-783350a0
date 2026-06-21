import { useMemo } from "react";
import type { EnrichedElement } from "@/lib/report.utils";
import { SECTION_LABELS } from "@/lib/report.constants";
import { Car, Armchair, Wrench, Disc3, Hash, FileText, Lightbulb, AppWindow, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Group = {
  key: string;
  label: string;
  icon: LucideIcon;
  match: (e: EnrichedElement) => boolean;
};

const GROUPS: Group[] = [
  { key: "body", label: "Кузов", icon: Car, match: (e) => e._sectionKey === "bodyElements" },
  { key: "interior", label: "Салон", icon: Armchair, match: (e) => e._sectionKey === "interiorElements" },
  { key: "engine", label: "Двигатель", icon: Wrench, match: (e) => e._sectionKey === "underHoodElements" },
  { key: "wheels", label: "Колёса и тормоза", icon: Disc3, match: (e) => e._sectionKey === "wheelsAndBrakesElements" },
  { key: "glass", label: "Стёкла", icon: AppWindow, match: (e) => e._sectionKey === "glassElements" },
  { key: "lighting", label: "Освещение", icon: Lightbulb, match: (e) => e._sectionKey === "lightningElements" },
  { key: "frame", label: "Силовые", icon: Shield, match: (e) => e._sectionKey === "bodyReinforcementElements" },
  { key: "vin", label: "VIN и маркировки", icon: Hash, match: (e) => e._sectionKey === "characteristics" || e._sectionKey === "car" },
  { key: "documents", label: "Документы", icon: FileText, match: (e) => e._sectionKey === "documents" || e._sectionKey === "legal" },
];

export function PhotoCategories({
  allElements,
  onOpen,
}: {
  allElements: EnrichedElement[];
  onOpen: (idx: number) => void;
}) {
  const tiles = useMemo(() => {
    return GROUPS.map((g) => {
      let count = 0;
      let firstIdx = -1;
      let cover: string | null = null;
      allElements.forEach((e, i) => {
        if (!g.match(e)) return;
        if (!e.file?.url) return;
        count++;
        if (firstIdx === -1) {
          firstIdx = i;
          cover = e.file.url;
        }
      });
      return { ...g, count, firstIdx, cover };
    }).filter((t) => t.count > 0);
  }, [allElements]);

  if (tiles.length === 0) return null;

  return (
    <section className="panel p-4 sm:p-5 md:p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Фото по категориям
        </h3>
        <span className="mono text-[11px] text-muted-foreground/70">
          {tiles.length} {tiles.length === 1 ? "категория" : "категорий"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => t.firstIdx >= 0 && onOpen(t.firstIdx)}
              className="group relative aspect-[4/3] rounded-lg border border-border bg-card overflow-hidden text-left hover:border-accent hover:shadow-sm transition-all"
              title={`${t.label} · ${t.count} фото`}
            >
              {t.cover ? (
                <img
                  src={t.cover}
                  alt={t.label}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : null}
              {/* Gradient overlay for legibility */}
              <span
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, oklch(0.15 0.02 250 / 0.05) 0%, oklch(0.15 0.02 250 / 0.65) 100%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-2.5 flex items-center justify-between gap-2 text-white">
                <span className="flex items-center gap-1.5 min-w-0">
                  <Icon size={14} strokeWidth={2} className="shrink-0" />
                  <span className="text-xs font-semibold truncate">{t.label}</span>
                </span>
                <span className="mono text-[10px] px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-sm tabular-nums">
                  {t.count}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
