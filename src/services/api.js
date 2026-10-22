import { appConfig } from "../core/config.js";
import { errorMessageFromPayload } from "../lib/errors.js";
import { clearSession, getToken } from "../lib/session.js";

const { apiBaseUrl: BACKEND_URL, apiTimeoutMs: DEFAULT_TIMEOUT_MS } = appConfig;

export class ApiError extends Error {
  constructor(message, { status = 0, code = "NETWORK_ERROR", data = null, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

function dispatchSessionExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("web-model:session-expired"));
  }
}

function combineAbortSignals(signal, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("timeout"), timeoutMs);

  const abortFromCaller = () => controller.abort(signal?.reason || "cancelled");
  if (signal) {
    if (signal.aborted) abortFromCaller();
    else signal.addEventListener("abort", abortFromCaller, { once: true });
  }

  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", abortFromCaller);
    },
  };
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  try {
    return await response.text();
  } catch {
    return null;
  }
}

export async function apiFetch(endpoint, options = {}) {
  if (!/^\/api\/v1(?:\/|$)/.test(endpoint) || endpoint.includes('..') || endpoint.includes('\\')) {
    throw new ApiError('Ruta de API inválida.', { code: 'INVALID_ENDPOINT' });
  }
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: callerSignal, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});
  const body = fetchOptions.body;
  const token = getToken();
  const request = combineAbortSignals(callerSignal, timeoutMs);

  if (!headers.has("Content-Type") && body && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", "Bearer " + token);
  }

  let response;
  let data;
  try {
    response = await fetch(new URL(endpoint, BACKEND_URL).toString(), {
      ...fetchOptions,
      headers,
      signal: request.signal,
    });
    data = await parseResponse(response);
  } catch (cause) {
    const code = request.signal.reason === "timeout" ? "REQUEST_TIMEOUT" : request.signal.aborted ? "REQUEST_ABORTED" : "NETWORK_ERROR";
    const message = code === "REQUEST_TIMEOUT"
      ? "La solicitud tardó demasiado. Inténtalo nuevamente."
      : "La solicitud fue cancelada o no se pudo conectar con el servidor.";
    throw new ApiError(message, { code, cause });
  } finally {
    request.cleanup();
  }

  if (!response.ok) {
    const code = data?.error?.code || "HTTP_" + response.status;
    const error = new ApiError(errorMessageFromPayload(data, response.status), {
      status: response.status,
      code,
      data,
    });
    const retryAfter = Number(response.headers.get('Retry-After'));
    error.retryAfterSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.ceil(retryAfter) : 0;
    if (response.status === 401 && token && token === getToken()) {
      clearSession();
      dispatchSessionExpired();
    }
    throw error;
  }
  return data;
}

export { BACKEND_URL, DEFAULT_TIMEOUT_MS };

