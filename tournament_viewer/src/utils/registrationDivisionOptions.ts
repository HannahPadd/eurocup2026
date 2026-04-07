import { Division } from "../models/Division";

export type RegistrationDivisionOption = {
  key: string;
  label: string;
  divisionIds: number[];
};

const DIVISION_LEVELS = ["LOW", "MID", "HIGH"] as const;
type DivisionLevel = (typeof DIVISION_LEVELS)[number];
const DIVISION_LEVEL_PATTERN = /\b(LOW|MID|HIGH)\b/i;
const DEFAULT_LEVEL_GROUP_LABEL = "ITG Precision";

function parseDivisionLevel(
  name: string,
): { level: DivisionLevel; baseLabel: string } | null {
  const match = name.match(DIVISION_LEVEL_PATTERN);
  if (!match) {
    return null;
  }

  return {
    level: match[1].toUpperCase() as DivisionLevel,
    baseLabel: name
      .replace(DIVISION_LEVEL_PATTERN, "")
      .replace(/\s{2,}/g, " ")
      .trim(),
  };
}

export function buildRegistrationDivisionOptions(
  divisions: Division[],
): RegistrationDivisionOption[] {
  const options: RegistrationDivisionOption[] = [];
  const groupIndexByKey = new Map<string, number>();
  const groupMetaByKey = new Map<
    string,
    { baseLabel: string; levels: Set<DivisionLevel> }
  >();

  for (const division of divisions) {
    const parsed = parseDivisionLevel(division.name);
    if (!parsed) {
      options.push({
        key: `division-${division.id}`,
        label: division.name,
        divisionIds: [division.id],
      });
      continue;
    }

    const groupKey = parsed.baseLabel.toLowerCase() || "__level_group__";
    const existingIndex = groupIndexByKey.get(groupKey);
    if (existingIndex === undefined) {
      groupIndexByKey.set(groupKey, options.length);
      groupMetaByKey.set(groupKey, {
        baseLabel: parsed.baseLabel,
        levels: new Set([parsed.level]),
      });
      options.push({
        key: `division-${division.id}`,
        label: division.name,
        divisionIds: [division.id],
      });
      continue;
    }

    const option = options[existingIndex];
    const groupMeta = groupMetaByKey.get(groupKey);
    if (!groupMeta) {
      continue;
    }

    option.divisionIds.push(division.id);
    groupMeta.levels.add(parsed.level);
    option.key = `group-${groupKey}`;
    option.label = `${
      groupMeta.baseLabel || DEFAULT_LEVEL_GROUP_LABEL
    } (${DIVISION_LEVELS.filter((level) => groupMeta.levels.has(level)).join(" / ")})`;
  }

  return options;
}
