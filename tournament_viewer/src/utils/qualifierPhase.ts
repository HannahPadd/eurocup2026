type PhaseLike = {
  name?: string;
  ruleset?: { name?: string; scope?: string } | null;
};

export function isQualifierPhase(phase?: PhaseLike | null): boolean {
  const scope = (phase?.ruleset?.scope ?? "").trim().toUpperCase();
  if (scope === "QUALIFIER") {
    return true;
  }

  const phaseName = (phase?.name ?? "").trim().toLowerCase();
  const rulesetName = (phase?.ruleset?.name ?? "").trim().toLowerCase();

  return (
    phaseName.includes("qualifier") ||
    phaseName.includes("seeding") ||
    rulesetName.includes("qualifier") ||
    rulesetName.includes("seeding")
  );
}
