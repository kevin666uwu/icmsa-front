const MESSAGES = {
  401: "Tu sesión expiró. Inicia sesión nuevamente.",
  403: "No tienes permisos para realizar esta acción.",
  404: "No encontramos el recurso solicitado.",
  409: "La información ya existe o entró en conflicto con otro cambio.",
  422: "Revisa los datos ingresados e inténtalo nuevamente.",
  429: "Demasiados intentos. Espera un momento e inténtalo nuevamente.",
  500: "Ocurrió un problema en el servidor. Inténtalo más tarde.",
};

export function errorMessageFromPayload(payload, status) {
  if (payload && typeof payload === "object") {
    const message = payload.error?.message || payload.detail || payload.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return MESSAGES[status] || "No fue posible completar la solicitud. Verifica tu conexión.";
}

export function userFacingError(error) {
  return error?.message || "No fue posible completar la solicitud. Verifica tu conexión.";
}

