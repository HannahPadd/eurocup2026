const LIVE_LOBBY_CODE_KEY = "itgOnlineLobbyCode";
const LIVE_LOBBY_PASSWORD_KEY = "itgOnlineLobbyPassword";
export const DEFAULT_LIVE_LOBBY_CODE = "BGYJ";

export const normalizeLobbyCode = (value: string): string =>
  value.trim().toUpperCase().slice(0, 8);

export const getLiveLobbyCode = (): string => {
  const raw = localStorage.getItem(LIVE_LOBBY_CODE_KEY);
  if (!raw) return DEFAULT_LIVE_LOBBY_CODE;
  const normalized = normalizeLobbyCode(raw);
  return normalized || DEFAULT_LIVE_LOBBY_CODE;
};

export const setLiveLobbyCode = (value: string): string => {
  const normalized = normalizeLobbyCode(value);
  if (!normalized) {
    localStorage.removeItem(LIVE_LOBBY_CODE_KEY);
    return DEFAULT_LIVE_LOBBY_CODE;
  }
  localStorage.setItem(LIVE_LOBBY_CODE_KEY, normalized);
  return normalized;
};

export const getLiveLobbyPassword = (): string =>
  localStorage.getItem(LIVE_LOBBY_PASSWORD_KEY) ?? "";

export const setLiveLobbyPassword = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    localStorage.removeItem(LIVE_LOBBY_PASSWORD_KEY);
    return "";
  }
  localStorage.setItem(LIVE_LOBBY_PASSWORD_KEY, normalized);
  return normalized;
};
