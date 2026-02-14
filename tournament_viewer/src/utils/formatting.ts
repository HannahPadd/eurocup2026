export const formatPercentageDisplay = (value?: string | number) => {
  if (value === null || value === undefined) {
    return "";
  }
  const numeric =
    typeof value === "number" ? value : Number(value.replace(",", "."));
  if (Number.isNaN(numeric)) {
    return "";
  }
  if (numeric >= 100) {
    return "100";
  }
  const clamped = Math.max(0, Math.min(99.99, numeric));
  return clamped.toFixed(2);
};

export const parsePercentage = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const numeric = Number(trimmed.replace(",", "."));
  if (Number.isNaN(numeric)) {
    return null;
  }
  if (numeric > 100) {
    return 100;
  }
  if (numeric < 0) {
    return 0;
  }
  return numeric;
};
