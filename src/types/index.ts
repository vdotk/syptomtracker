/** Built-in symptom keys — used for migration seeding. */
export const SYMPTOM_KEYS = [
  "backPain",
  "fingerSkinPeeling",
  "toeSkinPeeling",
  "chills",
  "fatigue",
  "jointStiffness",
  "skinRash",
  "fever",
  "brainFog",
  "eyeDryness",
  "sleepDisruption",
] as const;

export type BuiltInSymptomKey = (typeof SYMPTOM_KEYS)[number];

/** SymptomKey is now any string to support custom symptoms. */
export type SymptomKey = string;

export const SYMPTOM_LABELS: Record<BuiltInSymptomKey, string> = {
  backPain: "Back Pain",
  fingerSkinPeeling: "Finger Skin Peeling",
  toeSkinPeeling: "Toe Skin Peeling",
  chills: "Chills",
  fatigue: "Fatigue",
  jointStiffness: "Joint Stiffness",
  skinRash: "Skin Rash",
  fever: "Fever",
  brainFog: "Brain Fog",
  eyeDryness: "Eye Dryness",
  sleepDisruption: "Sleep Disruption",
};

export const SYMPTOM_EMOJI: Record<BuiltInSymptomKey, string> = {
  backPain: "\u{1F4AA}",
  fingerSkinPeeling: "\u{270B}",
  toeSkinPeeling: "\u{1F9B6}",
  chills: "\u{1F976}",
  fatigue: "\u{1F634}",
  jointStiffness: "\u{1F9B4}",
  skinRash: "\u{1F534}",
  fever: "\u{1F321}\u{FE0F}",
  brainFog: "\u{1F9E0}",
  eyeDryness: "\u{1F441}\u{FE0F}",
  sleepDisruption: "\u{1F319}",
};

/** Built-in symptoms that use mild/moderate/severe buttons */
export const ENUM_SEVERITY_SYMPTOMS: Set<string> = new Set([
  "fingerSkinPeeling",
  "toeSkinPeeling",
  "skinRash",
]);

/** Built-in symptoms that support image links */
export const IMAGE_LINK_SYMPTOMS: Set<string> = new Set([
  "fingerSkinPeeling",
  "toeSkinPeeling",
]);

export type Severity = "mild" | "moderate" | "severe";

export interface SymptomData {
  active: boolean;
  severity: number | Severity;
  notes?: string;
  imageLinks?: string[];
}

export type SymptomsRecord = Record<string, SymptomData>;

export interface FlareEntry {
  id: string;
  createdAt: string;
  flareStartDate: string;
  flareEndDate: string | null;
  symptoms: SymptomsRecord;
  overallSeverity: number;
  notes: string;
  tags: string[];
}
