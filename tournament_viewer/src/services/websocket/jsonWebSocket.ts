type JsonEventPayload = {
  event?: string;
  data?: unknown;
};

type JsonEventHandler = (payload: unknown) => void;
type WebSocketTarget = "api" | "itgonline";
type ConnectJsonWebSocketOptions = {
  target?: WebSocketTarget;
  disableOnFailure?: boolean;
};

const disabledPaths = new Set<string>();
const loggedDisabledPaths = new Set<string>();

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
  const disableOnFailure = options.disableOnFailure ?? true;
  const connectionKey = `${target}:${path}`;

  if (disableOnFailure && disabledPaths.has(connectionKey)) {
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
    if (disableOnFailure) {
      disabledPaths.add(connectionKey);
    }
    return null;
  }

  let opened = false;
  ws.addEventListener("open", () => {
    opened = true;
  });

  ws.addEventListener("error", () => {
    if (!opened && disableOnFailure) {
      disabledPaths.add(connectionKey);
    }
  });

  ws.addEventListener("close", (event) => {
    if (event.code !== 1000 && disableOnFailure) {
      disabledPaths.add(connectionKey);
      return;
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
