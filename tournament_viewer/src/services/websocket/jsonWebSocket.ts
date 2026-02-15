type JsonEventPayload = {
  event?: string;
  data?: unknown;
};

type JsonEventHandler = (payload: unknown) => void;

export function buildWebSocketUrl(path: string): string {
  const apiBase =
    import.meta.env.VITE_ITGONLINE_URL
  const url = new URL(path, apiBase);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

export function connectJsonWebSocket(
  path: string,
  handlers: Record<string, JsonEventHandler>,
): WebSocket {
  const ws = new WebSocket(buildWebSocketUrl(path));

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
