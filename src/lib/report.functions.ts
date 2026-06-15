import { createServerFn } from "@tanstack/react-start";
import { getServerConfig } from "./config.server";

export const getReport = createServerFn({ method: "GET" })
  .inputValidator((data: { token?: string } | undefined) => {
    const token = data?.token?.trim();
    if (!token) throw new Error("Не указан токен отчёта");
    return { token };
  })
  .handler(async ({ data }) => {
    const { sharedApiBaseUrl } = getServerConfig();
    const res = await fetch(
      `${sharedApiBaseUrl}/api/v1/shared/report?token=${encodeURIComponent(data.token)}`,
    );
    if (!res.ok) throw new Error(`Report fetch failed: ${res.status}`);
    const json = (await res.json()) as { result: CarReport; errors?: unknown[] };
    return json.result;
  });

// ---------- types ----------
export interface FileRef {
  id: number;
  sectionType?: string;
  filename: string;
  type: string;
  url: string;
}
export interface DamageTag {
  id: number;
  name: string;
  slug: string;
  type: "serious" | "non_serious" | string;
}
export interface InspectionElement {
  id: number;
  elementType: string;
  noDamage: boolean;
  seriousDamageTags: DamageTag[];
  noSeriousDamageTags: DamageTag[];
  note: string | null;
  audioNotes: FileRef[];
  file: FileRef | null;
  paintworkThicknessFrom?: number | null;
  paintworkThicknessTo?: number | null;
}
export interface CarReport {
  id: number;
  reportNumber: string;
  reportName: string;
  reportDate: string;
  vin: string;
  createdAt: string;
  carStep: {
    vin: string;
    unreadableVin?: boolean;
    gosNumber: string | null;
    uriListing: string | null;
    mileage: number | null;
    visuallyMileageNotMatchCondition?: boolean;
    cityInspection: string | null;
    dateInspection: string | null;
    ownersCount: number | null;
    listingFile: FileRef | null;
    files: FileRef[];
  };
  characteristicsStep?: {
    modelGenerationRestylingFrameId?: number | null;
    modelCarId?: number | null;
    engineVolume?: string | null;
    engineType?: string | null;
    transmission?: string | null;
    driveType?: string | null;
    color?: string | null;
    equipment?: string | null;
    files: FileRef[];
  };
  documentReconciliationStep: {
    ownersCount: number | null;
    ownerFullNameMatchWithPtsOrSts: boolean | null;
    vinOnBodyMatchWithPtsOrSts: boolean | null;
    engineModelMatchWithPtsOrSts: boolean | null;
    files: FileRef[];
  };
  legalReviewStep?: {
    id?: number;
    files: FileRef[];
  };
  inspectionStep: {
    bodyPaintworkThicknessFrom: number | null;
    bodyPaintworkThicknessTo: number | null;
    bodyReinforcementPaintworkThicknessFrom: number | null;
    bodyReinforcementPaintworkThicknessTo: number | null;
    bodyElements: InspectionElement[];
    bodyReinforcementElements: InspectionElement[];
    glassElements: InspectionElement[];
    interiorElements: InspectionElement[];
    underHoodElements: InspectionElement[];
    wheelsAndBrakesElements: InspectionElement[];
    lightningElements: InspectionElement[];
    computerDiagnosticsElements: InspectionElement[];
    files: FileRef[];
  };
  testDriveStep: {
    testDriveIsIncluded: boolean;
    testDriveEngineIsWorkingProperly: boolean;
    testDriveEngineTags: DamageTag[];
    testDriveTransmissionIsWorkingProperly: boolean;
    testDriveTransmissionTags: DamageTag[];
    testDriveSteeringWheelIsWorkingProperly: boolean;
    testDriveSteeringWheelTags: DamageTag[];
    testDriveSuspensionInDriveIsWorkingProperly: boolean;
    testDriveSuspensionInDriveTags: DamageTag[];
    testDriveBrakesInDriveIsWorkingProperly: boolean;
    testDriveBrakesInDriveTags: DamageTag[];
    testDriveNote: string | null;
    files: FileRef[];
  };
  resultStep: {
    summaryInspectionNote: string | null;
    resultSpecialistNote: string | null;
    files: FileRef[];
  };
}
