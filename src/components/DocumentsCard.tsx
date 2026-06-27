import type { CarReport } from "@/lib/report.api";
import { CheckRow } from "@/components/ReportPrimitives";

export function DocumentsCard({
  docs,
}: {
  docs: CarReport["documentReconciliationStep"];
}) {
  return (
    <div className="panel p-5 md:p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Сверка ПТС / СТС
      </h3>
      <CheckRow
        label="ФИО владельца совпадает с ПТС/СТС"
        ok={docs.ownerFullNameMatchWithPtsOrSts}
      />
      <CheckRow
        label="VIN на кузове совпадает с ПТС/СТС"
        ok={docs.vinOnBodyMatchWithPtsOrSts}
      />
      <CheckRow
        label="Модель двигателя совпадает с ПТС/СТС"
        ok={docs.engineModelMatchWithPtsOrSts}
      />
      <div className="flex items-center justify-between gap-3 py-2 border-b border-dashed border-border last:border-0">
        <span className="text-sm">Количество владельцев</span>
        <span className="mono text-sm font-semibold ink">
          {docs.ownersCount ?? "—"}
        </span>
      </div>
    </div>
  );
}
