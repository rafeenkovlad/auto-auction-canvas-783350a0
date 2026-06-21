import { useMemo } from "react";
import type {
  CarReport,
  FileRef,
  InspectionElement,
} from "@/lib/report.api";
import type { GalleryItem } from "@/components/MediaGallery";
import {
  SECTION_KEYS,
  SECTION_LABELS,
  ELEMENT_LABEL,
  STEP_LABELS,
} from "@/lib/report.constants";
import {
  getElementStatus,
  isVideoFile,
  type EnrichedElement,
} from "@/lib/report.utils";

export interface ReportData {
  sections: Array<{ key: string; elements: EnrichedElement[] }>;
  allElements: EnrichedElement[];
  gallery: GalleryItem[];
  additional: GalleryItem[];
  heroImage: string | null;
  heroSrcSet: string | null;
  characteristics: Array<[string, string | number]>;
}

const SIZE_WIDTHS: Record<string, number> = { s: 240, m: 300, l: 400, xl: 600 };

function buildSectionsAndGallery(report: CarReport) {
  const sections: Array<{ key: string; elements: EnrichedElement[] }> = [];
  const body: EnrichedElement[] = [];
  for (const key of SECTION_KEYS) {
    const arr = report.inspectionStep[key] as InspectionElement[] | undefined;
    if (!arr || arr.length === 0) {
      sections.push({ key, elements: [] });
      continue;
    }
    const enriched: EnrichedElement[] = arr.map((el) => ({
      ...el,
      _status: getElementStatus(el),
      _category: SECTION_LABELS[key] ?? key,
      _displayName:
        ELEMENT_LABEL[el.elementType] ?? el.elementType.replace(/_/g, " "),
      _sectionKey: key,
    }));
    body.push(...enriched);
    sections.push({ key, elements: enriched });
  }

  const allElements: EnrichedElement[] = [...body];
  const gallery: GalleryItem[] = [];
  for (let i = 0; i < body.length; i++) {
    const el = body[i];
    if (el.file?.url) {
      const severeTag = el.seriousDamageTags[0];
      const minorTag = el.noSeriousDamageTags[0];
      const tag = severeTag
        ? { name: severeTag.name, severe: true }
        : minorTag
        ? { name: minorTag.name, severe: false }
        : null;
      gallery.push({
        file: el.file,
        idx: i,
        caption: el._displayName,
        sectionKey: el._sectionKey,
        isVideo: isVideoFile(el.file),
        isDamage: el._status !== "ok",
        tag,
      });
    }
  }

  const fileSources: Array<{
    key: string;
    files: (FileRef | null | undefined)[];
  }> = [
    {
      key: "car",
      files: [report.carStep.listingFile, ...(report.carStep.files ?? [])],
    },
    { key: "characteristics", files: report.characteristicsStep?.files ?? [] },
    { key: "documents", files: report.documentReconciliationStep.files ?? [] },
    { key: "legal", files: report.legalReviewStep?.files ?? [] },
    { key: "inspection", files: report.inspectionStep.files ?? [] },
    { key: "testDrive", files: report.testDriveStep.files ?? [] },
    { key: "result", files: report.resultStep.files ?? [] },
  ];
  const additional: GalleryItem[] = [];
  for (const src of fileSources) {
    const caption = STEP_LABELS[src.key] ?? src.key;
    const isInspection = src.key === "inspection";
    for (const f of src.files) {
      if (!f || !f.url) continue;
      const idx = allElements.length;
      // Use a large negative offset so pseudo ids cannot collide with real ids.
      allElements.push({
        id: -1_000_000 - idx,
        elementType: src.key,
        noDamage: true,
        seriousDamageTags: [],
        noSeriousDamageTags: [],
        note: null,
        audioNotes: [],
        file: f,
        _status: "ok",
        _category: caption,
        _displayName: caption,
        _sectionKey: src.key,
      });
      const item: GalleryItem = {
        file: f,
        idx,
        caption,
        sectionKey: src.key,
        isVideo: isVideoFile(f),
        isDamage: false,
      };
      if (isInspection) gallery.push(item);
      else additional.push(item);
    }
  }

  return { sections, allElements, gallery, additional };
}

function buildHero(report: CarReport) {
  const photos =
    (report.carReference ?? report.characteristicsStep?.carReference)?.photos ??
    [];
  // Use only small/medium variants — large ones look oversized and blurry
  // when scaled down into the hero slot.
  const allowed = new Set(["s", "m"]);
  const srcSetEntries: string[] = [];
  for (const p of photos) {
    if (!allowed.has(p.size)) continue;
    const base = SIZE_WIDTHS[p.size] ?? 300;
    if (p.urlX1) srcSetEntries.push(`${p.urlX1} ${base}w`);
    if (p.urlX2) srcSetEntries.push(`${p.urlX2} ${base * 2}w`);
  }
  const heroSrcSet = srcSetEntries.join(", ") || null;
  const pickPhoto =
    photos.find((p) => p.size === "s") ??
    photos.find((p) => p.size === "m") ??
    photos[0];
  const heroImage =
    pickPhoto?.urlX2 ??
    pickPhoto?.urlX1 ??
    report.characteristicsStep?.carImageUrl ??
    null;
  return { heroImage, heroSrcSet };
}

function buildCharacteristics(report: CarReport): Array<[string, string | number]> {
  const c = report.characteristicsStep;
  const ref = report.carReference ?? report.characteristicsStep?.carReference;
  const restyling = ref?.restyling;
  const yearStart = restyling?.yearStart
    ? new Date(restyling.yearStart).getFullYear()
    : null;
  const yearEnd = restyling?.yearEnd
    ? new Date(restyling.yearEnd).getFullYear()
    : null;
  const yearsStr = yearStart ? `${yearStart}–${yearEnd ?? "н.в."}` : null;
  const brandStr = ref?.brand
    ? [ref.brand.nameRus, ref.brand.name].filter(Boolean).join(" / ")
    : null;
  const modelStr = ref?.model
    ? [ref.model.nameRus, ref.model.name].filter(Boolean).join(" / ")
    : null;
  const rows: Array<[string, string | number | null | undefined]> = [
    ["VIN", report.vin],
    ["Марка", brandStr],
    ["Модель", modelStr],
    ["Поколение", ref?.generation?.name ?? null],
    [
      "Рестайлинг",
      restyling?.name
        ? `${restyling.name}${yearsStr ? ` (${yearsStr})` : ""}`
        : yearsStr,
    ],
    ["Кузов (frame)", ref?.frame?.name ?? null],
    ["Комплектация", c?.equipment ?? null],
    ["Двигатель", c?.engineType],
    ["Объём", c?.engineVolume],
    ["КПП", c?.transmission],
    ["Привод", c?.driveType],
    ["Цвет", c?.color],
  ];
  return rows.filter(
    (r): r is [string, string | number] => r[1] != null && r[1] !== "",
  );
}

export function useReportData(report: CarReport): ReportData {
  return useMemo(() => {
    const { sections, allElements, gallery, additional } =
      buildSectionsAndGallery(report);
    const { heroImage, heroSrcSet } = buildHero(report);
    const characteristics = buildCharacteristics(report);
    return {
      sections,
      allElements,
      gallery,
      additional,
      heroImage,
      heroSrcSet,
      characteristics,
    };
  }, [report]);
}
