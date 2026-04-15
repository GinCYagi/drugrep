import { DoseEvent } from "@/types/domain";

export const mockEvents: DoseEvent[] = [
  {
    id: "e1",
    substanceId: "methylphenidate",
    takenAt: "2026-04-15T00:15:00+09:00",
    doseValue: 108,
    doseUnit: "mg",
    route: "rectal",
  },
  {
    id: "e2",
    substanceId: "methylphenidate",
    takenAt: "2026-04-15T01:35:00+09:00",
    doseValue: 108,
    doseUnit: "mg",
    route: "rectal",
    duplicateIntake: true,
  },
  {
    id: "e3",
    substanceId: "pregabalin",
    takenAt: "2026-04-15T03:00:00+09:00",
    doseValue: 300,
    doseUnit: "mg",
    route: "oral",
    symptoms: ["眠い"],
  },
  {
    id: "e4",
    substanceId: "tramadol_combo",
    takenAt: "2026-04-15T03:00:00+09:00",
    doseValue: 2,
    doseUnit: "tablet",
    route: "oral",
  },
  {
    id: "e5",
    substanceId: "methylphenidate",
    takenAt: "2026-04-15T03:25:00+09:00",
    doseValue: 72,
    doseUnit: "mg",
    route: "rectal",
  },
  {
    id: "e6",
    substanceId: "moclobemide",
    takenAt: "2026-04-15T07:03:00+09:00",
    doseValue: 600,
    doseUnit: "mg",
    route: "oral",
  },
];