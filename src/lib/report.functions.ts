import { createServerFn } from "@tanstack/react-start";

const DEFAULT_TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE3ODAxNjk2MzcuODY1Nzg5LCJleHAiOjE3ODI3NjE2MzcuODY1Nzg5LCJzdWIiOiJSRVAtQTM0NDIyMiIsInR5cGUiOiJzaGFyZSJ9.Tx8_ND-BJtVMOuovgICtx0uxYvK7z2GCmAMZF_ZOzEbzo-GU1HEBWmqImQ3xi6GkvP5RUA-EUW1tSvwZSe7rBX5e17typ5xnX5DJXowFML5Bw9MYTu0UDE4RTvCK0NBs57AfLz82GrTsjAi8ehqpeV8Nlp1ptQfFT6rZIltycamD4XIZYn_LQW0jiATpOcR4FNlFpVBuFEgp6MruxpmXEFvcAabUYBF0AtZao0buNbho2Y_BN4U_qUtktW1sie9_jfaxjsy1C0fbYUPe5H5KGFm6Jnjzh0hRFR0-NdiLYZPYXn2pOCH7Vvy7fDd0PqOe2-vCYivjyYgoZZtPiCnM5A";

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
    gosNumber: string | null;
    uriListing: string | null;
    mileage: number | null;
    cityInspection: string | null;
    dateInspection: string | null;
    ownersCount: number | null;
    listingFile: FileRef | null;
    files: FileRef[];
  };
  documentReconciliationStep: {
    ownersCount: number | null;
    ownerFullNameMatchWithPtsOrSts: boolean | null;
    vinOnBodyMatchWithPtsOrSts: boolean | null;
    engineModelMatchWithPtsOrSts: boolean | null;
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
