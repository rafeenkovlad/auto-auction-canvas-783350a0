import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getReport, type InspectionElement } from "@/lib/report.functions";
import { ElementViewer } from "@/components/ElementViewer";
import { SchemaTabs } from "@/components/SchemaTabs";
import { MediaGallery } from "@/components/MediaGallery";
import { InspectionHistoryTimeline } from "@/components/InspectionHistoryTimeline";
import { GalleryTileBody } from "@/components/GalleryTile";
import { ReportHeader } from "@/components/ReportHeader";
import { HeroSection } from "@/components/HeroSection";
import { TechnicalStatePanel } from "@/components/TechnicalStatePanel";
import { DocumentsCard } from "@/components/DocumentsCard";
import { TestDriveCard } from "@/components/TestDriveCard";
import { AdditionalMaterials } from "@/components/AdditionalMaterials";
import { ExpertConclusion } from "@/components/ExpertConclusion";
import { statusMeta } from "@/lib/report.utils";
import { useReportData } from "@/hooks/useReportData";

const reportQuery = (token?: string) =>
  queryOptions({
    queryKey: ["report", token ?? "default"],
    queryFn: () => getReport({ data: token ? { token } : undefined }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Отчёт о проверке автомобиля — Auto Auction Canvas" },
      {
        name: "description",
        content:
          "Подробный отчёт о техническом состоянии автомобиля: схема кузова, осмотр элементов, тест-драйв и заключение специалиста.",
      },
    ],
  }),
  component: AuctionSheetPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="panel p-8 max-w-lg text-center">
        <h1 className="text-2xl font-bold ink mb-2">Не удалось загрузить отчёт</h1>
        <p className="text-muted-foreground text-sm">{error.message}</p>
      </div>
    </div>
  ),
});

function AuctionSheetPage() {
  const { token } = Route.useSearch();
  const { data: report } = useSuspenseQuery(reportQuery(token));
  const carName = report.reportName.replace(/^.*·\s*/, "");

  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const {
    sections,
    allElements,
    gallery,
    additional,
    heroImage,
    heroSrcSet,
    characteristics,
  } = useReportData(report);

  const openElement = useCallback(
    (el: InspectionElement) => {
      const idx = allElements.findIndex((e) => e.id === el.id);
      if (idx >= 0) setActiveIdx(idx);
    },
    [allElements],
  );

  return (
    <main
      className="min-h-screen py-5 px-3 md:px-6"
      // Hide underlying content (esp. native <video> thumbnails on iOS which
      // render in a separate compositor layer and can bleed through overlays).
      style={activeIdx != null ? { visibility: "hidden" } : undefined}
      aria-hidden={activeIdx != null ? true : undefined}
    >
      <div className="mx-auto max-w-7xl space-y-4">
        <ReportHeader report={report} />

        <HeroSection
          report={report}
          carName={carName}
          heroImage={heroImage}
          heroSrcSet={heroSrcSet}
          characteristics={characteristics}
        />

        <section className="grid lg:grid-cols-2 gap-4">
          <SchemaTabs
            bodyElements={report.inspectionStep.bodyElements ?? []}
            interiorElements={report.inspectionStep.interiorElements ?? []}
            frameElements={report.inspectionStep.bodyReinforcementElements ?? []}
            wheelsElements={report.inspectionStep.wheelsAndBrakesElements ?? []}
            glassElements={report.inspectionStep.glassElements ?? []}
            lightingElements={report.inspectionStep.lightningElements ?? []}
            onElementClick={openElement}
          />
          <TechnicalStatePanel
            sections={sections}
            inspection={report.inspectionStep}
          />
        </section>

        <InspectionHistoryTimeline />

        <MediaGallery
          items={gallery}
          onOpen={setActiveIdx}
          renderTile={(item) => <GalleryTileBody item={item} />}
        />

        <AdditionalMaterials items={additional} onOpen={setActiveIdx} />

        <section className="grid md:grid-cols-2 gap-4">
          <DocumentsCard docs={report.documentReconciliationStep} />
          <TestDriveCard report={report} />
        </section>

        <ExpertConclusion result={report.resultStep} />

        <footer className="text-center mono text-[11px] text-muted-foreground py-4">
          Сгенерировано на основе данных carreports.ru · {report.reportNumber}
        </footer>
      </div>

      <ElementViewer
        elements={allElements}
        index={activeIdx}
        onClose={() => setActiveIdx(null)}
        onChange={(i) => setActiveIdx(i)}
        statusMeta={statusMeta}
      />
    </main>
  );
}
