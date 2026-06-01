import { createServerFn } from "@tanstack/react-start";

const DEFAULT_TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE3ODAyNTUwNzQuMDUxMjEyLCJleHAiOjE3ODI4NDcwNzQuMDUxMjEyLCJzdWIiOiJSRVAtQTg3MjQxNiIsInR5cGUiOiJzaGFyZSJ9.iYI08Ek3D4xdyUMqzxWW3o_UyWF0prtG_XNTHYRHDpUgvnPCYm-z7tHqXcg1BEVfpWCYFVU2F2q0n9mjU8Hb3vQ1ltPHnsTVRjK0MRMTlgVb7P_HwKrywXgEushD40QjoRXLJPMojckbjOCUOynZhYBETC4pVvxi4sCXpe7yy8Wkah64j30DvAiHvN4pbWzgJC7x0ifydk6-_wTbVt9eqECzdV_t_hjuD0-_BUd5L1H6BkidO5hvfdAVvH-jCmN59pqo8Sai0nW49CQtmg9g91H9HiyImgtN_MqMvvfSH0pyIe7D1fgE_V13u9KZBkqaTV6zdLIKlsyObaj9CgEsGw";

export const getReport = createServerFn({ method: "GET" })
  .inputValidator((data: { token?: string } | undefined) => data ?? {})
  .handler(async ({ data }) => {
    const token = data.token || DEFAULT_TOKEN;
    const res = await fetch(
      `https://carreports.ru/api/v1/shared/report?token=${encodeURIComponent(token)}`,
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
