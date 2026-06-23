// Client-side fetch to avoid Cloudflare Worker outbound fetch failures
// ("Network connection lost") when calling carreports.ru from SSR.
// carreports.ru returns `Access-Control-Allow-Origin: *`, so direct
// browser fetch works fine.

const SHARED_API_BASE_URL = "https://carreports.ru";

export async function getReport(args?: {
  data?: { token?: string };
}): Promise<CarReport> {
  const token = args?.data?.token?.trim();
  if (!token) throw new Error("Не указан токен отчёта");
  const res = await fetch(
    `${SHARED_API_BASE_URL}/api/v1/shared/report?token=${encodeURIComponent(token)}`,
  );
  if (!res.ok) throw new Error(`Report fetch failed: ${res.status}`);
  const json = (await res.json()) as { result: CarReport; errors?: unknown[] };
  return json.result;
}

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
export interface CarReferencePhoto {
  id: number;
  size: string;
  urlX1: string;
  urlX2: string;
}
export interface CarReference {
  brand?: { id: number; name: string; nameRus?: string; slug?: string } | null;
  model?: { id: number; name: string; nameRus?: string; slug?: string } | null;
  generation?: { id: number; name: number | string } | null;
  restyling?: { id: number; name: string; yearStart?: string | null; yearEnd?: string | null } | null;
  frame?: { id: number; name: string } | null;
  photos?: CarReferencePhoto[];
}
export interface CarReport {
  id: number;
  reportNumber: string;
  reportName: string;
  reportDate: string;
  vin: string;
  createdAt: string;
  carReference?: CarReference | null;
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
    carImageUrl?: string | null;
    carReference?: CarReference | null;
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
  history?: ReportHistoryEntry[];
}

export interface ReportHistoryEntry {
  reportNumber: string;
  dateInspection: string | null;
  mileage: number | null;
  author?: { id: number; firstName?: string | null; lastName?: string | null } | null;
  shareUrl?: string | null;
}
