import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { getReport, type InspectionElement } from "@/lib/report.api";
import { ElementViewer } from "@/components/ElementViewer";
import { SchemaTabs } from "@/components/SchemaTabs";
import { MediaGallery } from "@/components/MediaGallery";
import { InspectionHistoryTimeline } from "@/components/InspectionHistoryTimeline";
import { GalleryTileBody } from "@/components/GalleryTile";
import { ReportHeader } from "@/components/ReportHeader";
import { ReportHeaderCard } from "@/components/ReportHeaderCard";
import { PhotoCategories } from "@/components/PhotoCategories";
import { TechnicalStatePanel } from "@/components/TechnicalStatePanel";
import { DocumentsCard } from "@/components/DocumentsCard";
import { TestDriveCard } from "@/components/TestDriveCard";
import { AdditionalMaterials } from "@/components/AdditionalMaterials";
import { ExpertConclusion } from "@/components/ExpertConclusion";
import { statusMeta } from "@/lib/report.utils";
import { useReportData } from "@/hooks/useReportData";
import { preloadSchemaImages } from "@/lib/schema-preload";

const reportQuery = (token?: string) =>
  queryOptions({
    queryKey: ["report", token ?? "default"],
    queryFn: () => getReport({ data: token ? { token } : undefined }),
    staleTime: 60_000,
  });

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Отчёт о проверке автомобиля — VIN DIEZEL" },
      {
        name: "description",
        content:
          "Независимый отчёт VIN DIEZEL: оценка состояния, схема осмотра, фото по категориям, тест-драйв и заключение специалиста.",
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
  useEffect(() => {
    // Warm cache for all schema backgrounds as soon as the page mounts.
    preloadSchemaImages();
  }, []);
  const reportResult = useQuery({
    ...reportQuery(token),
    enabled: Boolean(token),
  });

  if (!token) {
    return <ReportStateCard title="Не указан токен отчёта" />;
  }

  if (reportResult.isPending) {
    return <ReportStateCard title="Загружаем отчёт" />;
  }

  if (reportResult.isError) {
    return (
      <ReportStateCard
        title="Не удалось загрузить отчёт"
        message={reportResult.error.message}
      />
    );
  }

  const report = reportResult.data;

  return <ReportContent report={report} />;
}

function ReportContent({ report }: { report: Awaited<ReturnType<typeof getReport>> }) {
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

        <ReportHeaderCard
          report={report}
          carName={carName}
          heroImage={heroImage}
          heroSrcSet={heroSrcSet}
          characteristics={characteristics}
          allElements={allElements}
        />

        <section className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4">
          <SchemaTabs
            bodyElements={report.inspectionStep.bodyElements ?? []}
            interiorElements={report.inspectionStep.interiorElements ?? []}
            frameElements={report.inspectionStep.bodyReinforcementElements ?? []}
            wheelsElements={report.inspectionStep.wheelsAndBrakesElements ?? []}
            glassElements={report.inspectionStep.glassElements ?? []}
            lightingElements={report.inspectionStep.lightningElements ?? []}
            onElementClick={openElement}
          />
          <TechStateCompact sections={sections} />
        </section>

        <PhotoCategories allElements={allElements} onOpen={setActiveIdx} />

        <section className="grid md:grid-cols-2 gap-4">
          <TestDriveCard report={report} />
          <DocumentsCard docs={report.documentReconciliationStep} />
        </section>

        <TechnicalStatePanel
          sections={sections}
          inspection={report.inspectionStep}
        />

        <InspectionHistoryTimeline />

        <MediaGallery
          items={gallery}
          onOpen={setActiveIdx}
          renderTile={(item) => <GalleryTileBody item={item} />}
        />

        <AdditionalMaterials items={additional} onOpen={setActiveIdx} />

        <ExpertConclusion result={report.resultStep} />

        <footer className="text-center mono text-[11px] text-muted-foreground py-4">
          VIN DIEZEL · Независимая экспертиза автомобиля · {report.reportNumber}
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

function ReportStateCard({ title, message }: { title: string; message?: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="panel p-8 max-w-lg text-center">
        <h1 className="text-2xl font-bold ink mb-2">{title}</h1>
        {message && <p className="text-muted-foreground text-sm">{message}</p>}
      </div>
    </main>
  );
}
