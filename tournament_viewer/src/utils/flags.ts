const COUNTRY_OVERRIDES: Record<string, string> = {
  "united states": "us",
  usa: "us",
  "u.s.": "us",
  "u.s.a.": "us",
  "united kingdom": "gb",
  uk: "gb",
  england: "gb",
  scotland: "gb",
  wales: "gb",
  "northern ireland": "gb",
  "south korea": "kr",
  "republic of korea": "kr",
  "north korea": "kp",
  russia: "ru",
  vietnam: "vn",
  "czech republic": "cz",
  czechia: "cz",
  iran: "ir",
  syria: "sy",
  venezuela: "ve",
  bolivia: "bo",
  tanzania: "tz",
  laos: "la",
  brunei: "bn",
  myanmar: "mm",
  burma: "mm",
  "cape verde": "cv",
  "cabo verde": "cv",
  albania: "al",
  andorra: "ad",
  austria: "at",
  belarus: "by",
  belgium: "be",
  "bosnia and herzegovina": "ba",
  bosnia: "ba",
  bulgaria: "bg",
  croatia: "hr",
  cyprus: "cy",
  denmark: "dk",
  estonia: "ee",
  finland: "fi",
  france: "fr",
  georgia: "ge",
  germany: "de",
  greece: "gr",
  hungary: "hu",
  iceland: "is",
  ireland: "ie",
  italy: "it",
  kosovo: "xk",
  latvia: "lv",
  liechtenstein: "li",
  lithuania: "lt",
  luxembourg: "lu",
  malta: "mt",
  moldova: "md",
  monaco: "mc",
  montenegro: "me",
  netherlands: "nl",
  "the netherlands": "nl",
  norway: "no",
  poland: "pl",
  portugal: "pt",
  romania: "ro",
  "san marino": "sm",
  serbia: "rs",
  slovakia: "sk",
  slovenia: "si",
  spain: "es",
  sweden: "se",
  switzerland: "ch",
  turkey: "tr",
  ukraine: "ua",
  "north macedonia": "mk",
  macedonia: "mk",
  "vatican city": "va",
  "holy see": "va",
};

const normalizeCountry = (country?: string) => {
  if (!country) {
    return "";
  }
  const trimmed = country.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }
  const split = trimmed.split(/[,(]/)[0]?.trim() ?? "";
  return split;
};

const UNIVERSAL_FLAG_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='64' height='48' viewBox='0 0 64 48'>" +
      "<rect width='64' height='48' rx='4' fill='#0f172a'/>" +
      "<circle cx='32' cy='24' r='14' fill='#1f2937' stroke='#94a3b8' stroke-width='2'/>" +
      "<path d='M18 24h28M32 10v28M22 16c6 4 14 4 20 0M22 32c6-4 14-4 20 0' stroke='#94a3b8' stroke-width='1.5' fill='none'/>" +
    "</svg>"
  );

export const countryToIsoCode = (country?: string) => {
  const normalized = normalizeCountry(country);
  if (!normalized) {
    return "";
  }
  if (COUNTRY_OVERRIDES[normalized]) {
    return COUNTRY_OVERRIDES[normalized];
  }
  if (normalized.length === 2) {
    return normalized;
  }
  return "";
};

const nearestFlagWidth = (size: number) => {
  if (size <= 24) return 20;
  if (size <= 48) return 40;
  if (size <= 96) return 80;
  return 160;
};

export const countryToFlagUrl = (country?: string, size = 40) => {
  const iso = countryToIsoCode(country);
  const clamped = nearestFlagWidth(Math.max(20, Math.round(size)));
  if (!iso) {
    return UNIVERSAL_FLAG_DATA_URI;
  }
  return `https://flagcdn.com/w${clamped}/${iso}.png`;
};
