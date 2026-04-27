type JsonEventPayload = {
  event?: string;
  data?: unknown;
};

type JsonEventHandler = (payload: unknown) => void;
type WebSocketTarget = "api" | "itgonline";
type ConnectJsonWebSocketOptions = {
  target?: WebSocketTarget;
};

const disabledPaths = new Set<string>();
const loggedDisabledPaths = new Set<string>();

const EARLY_CLOSE_MS = 3000;

function toWebSocketProtocol(protocol: string): string {
  if (protocol === "https:") {
    return "wss:";
  }
  if (protocol === "http:") {
    return "ws:";
  }
  return protocol;
}

function getBaseForTarget(target: WebSocketTarget): string {
  if (target === "itgonline") {
    return import.meta.env.VITE_ITGONLINE_URL;
  }

  return (
    import.meta.env.VITE_PUBLIC_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    window.location.origin
  );
}

export function buildWebSocketUrl(
  path: string,
  target: WebSocketTarget = "api",
): string {
  const base = getBaseForTarget(target);
  const url = new URL(path, base);
  url.protocol = toWebSocketProtocol(url.protocol);
  return url.toString();
}

export function connectJsonWebSocket(
  path: string,
  handlers: Record<string, JsonEventHandler>,
  options: ConnectJsonWebSocketOptions = {},
): WebSocket | null {
  const target = options.target ?? "api";
  const connectionKey = `${target}:${path}`;

  if (disabledPaths.has(connectionKey)) {
    if (!loggedDisabledPaths.has(connectionKey)) {
      console.info(
        `WebSocket connection skipped for "${connectionKey}" after initial failure.`,
      );
      loggedDisabledPaths.add(connectionKey);
    }
    return null;
  }

  let ws: WebSocket;
  try {
    ws = new WebSocket(buildWebSocketUrl(path, target));
  } catch (error) {
    console.warn(`WebSocket disabled for "${connectionKey}"`, error);
    disabledPaths.add(connectionKey);
    return null;
  }

  const connectedAt = Date.now();
  let opened = false;
  ws.addEventListener("open", () => {
    opened = true;
  });

  ws.addEventListener("error", () => {
    if (!opened) {
      disabledPaths.add(connectionKey);
    }
  });

  ws.addEventListener("close", (event) => {
    const closedTooEarly = Date.now() - connectedAt < EARLY_CLOSE_MS;
    if (event.code !== 1000) {
      disabledPaths.add(connectionKey);
      return;
    }

    if (!opened || closedTooEarly) {
      disabledPaths.add(connectionKey);
    }
  });

  ws.onmessage = (messageEvent) => {
    if (typeof messageEvent.data !== "string") {
      return;
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(messageEvent.data);
    } catch {
      return;
    }

    let eventName: string | undefined;
    let eventData: unknown;

    if (Array.isArray(parsed) && typeof parsed[0] === "string") {
      eventName = parsed[0];
      eventData = parsed[1];
    } else {
      const payload = parsed as JsonEventPayload;
      if (typeof payload?.event === "string") {
        eventName = payload.event;
        eventData = payload.data;
      }
    }

    if (!eventName || !(eventName in handlers)) {
      return;
    }

    handlers[eventName](eventData);
  };

  return ws;
}
