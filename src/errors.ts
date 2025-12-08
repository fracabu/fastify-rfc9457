/**
 * Standard HTTP status titles (RFC 9110)
 */
export const HTTP_STATUS_TITLES: Record<number, string> = {
  // 4xx Client Errors
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Content Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  418: "I'm a Teapot",
  421: 'Misdirected Request',
  422: 'Unprocessable Content',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',

  // 5xx Server Errors
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  510: 'Not Extended',
  511: 'Network Authentication Required'
}

/**
 * Type URI slugs for common HTTP status codes
 */
export const HTTP_STATUS_TYPE_SLUGS: Record<number, string> = {
  400: 'bad-request',
  401: 'unauthorized',
  402: 'payment-required',
  403: 'forbidden',
  404: 'not-found',
  405: 'method-not-allowed',
  406: 'not-acceptable',
  408: 'request-timeout',
  409: 'conflict',
  410: 'gone',
  411: 'length-required',
  412: 'precondition-failed',
  413: 'content-too-large',
  414: 'uri-too-long',
  415: 'unsupported-media-type',
  416: 'range-not-satisfiable',
  417: 'expectation-failed',
  418: 'teapot',
  422: 'unprocessable-entity',
  423: 'locked',
  424: 'failed-dependency',
  425: 'too-early',
  426: 'upgrade-required',
  428: 'precondition-required',
  429: 'too-many-requests',
  431: 'request-header-fields-too-large',
  451: 'unavailable-for-legal-reasons',
  500: 'internal-server-error',
  501: 'not-implemented',
  502: 'bad-gateway',
  503: 'service-unavailable',
  504: 'gateway-timeout',
  505: 'http-version-not-supported',
  507: 'insufficient-storage',
  508: 'loop-detected',
  511: 'network-authentication-required'
}

/**
 * Italian translations for HTTP status titles
 */
export const HTTP_STATUS_TITLES_IT: Record<number, string> = {
  400: 'Richiesta Non Valida',
  401: 'Non Autorizzato',
  402: 'Pagamento Richiesto',
  403: 'Accesso Negato',
  404: 'Non Trovato',
  405: 'Metodo Non Consentito',
  406: 'Non Accettabile',
  408: 'Timeout Richiesta',
  409: 'Conflitto',
  410: 'Non Più Disponibile',
  422: 'Entità Non Processabile',
  429: 'Troppe Richieste',
  500: 'Errore Interno del Server',
  501: 'Non Implementato',
  502: 'Gateway Non Valido',
  503: 'Servizio Non Disponibile',
  504: 'Timeout Gateway'
}

/**
 * Spanish translations for HTTP status titles
 */
export const HTTP_STATUS_TITLES_ES: Record<number, string> = {
  400: 'Solicitud Incorrecta',
  401: 'No Autorizado',
  402: 'Pago Requerido',
  403: 'Prohibido',
  404: 'No Encontrado',
  405: 'Método No Permitido',
  406: 'No Aceptable',
  408: 'Tiempo de Espera Agotado',
  409: 'Conflicto',
  410: 'Ya No Disponible',
  422: 'Entidad No Procesable',
  429: 'Demasiadas Solicitudes',
  500: 'Error Interno del Servidor',
  501: 'No Implementado',
  502: 'Puerta de Enlace Incorrecta',
  503: 'Servicio No Disponible',
  504: 'Tiempo de Espera de la Puerta de Enlace'
}

/**
 * German translations for HTTP status titles
 */
export const HTTP_STATUS_TITLES_DE: Record<number, string> = {
  400: 'Ungültige Anfrage',
  401: 'Nicht Autorisiert',
  402: 'Zahlung Erforderlich',
  403: 'Verboten',
  404: 'Nicht Gefunden',
  405: 'Methode Nicht Erlaubt',
  406: 'Nicht Akzeptabel',
  408: 'Zeitüberschreitung',
  409: 'Konflikt',
  410: 'Nicht Mehr Verfügbar',
  422: 'Nicht Verarbeitbar',
  429: 'Zu Viele Anfragen',
  500: 'Interner Serverfehler',
  501: 'Nicht Implementiert',
  502: 'Ungültiges Gateway',
  503: 'Dienst Nicht Verfügbar',
  504: 'Gateway-Zeitüberschreitung'
}

/**
 * French translations for HTTP status titles
 */
export const HTTP_STATUS_TITLES_FR: Record<number, string> = {
  400: 'Requête Invalide',
  401: 'Non Autorisé',
  402: 'Paiement Requis',
  403: 'Interdit',
  404: 'Non Trouvé',
  405: 'Méthode Non Autorisée',
  406: 'Non Acceptable',
  408: 'Délai Dépassé',
  409: 'Conflit',
  410: 'Disparu',
  422: 'Entité Non Traitable',
  429: 'Trop de Requêtes',
  500: 'Erreur Interne du Serveur',
  501: 'Non Implémenté',
  502: 'Passerelle Incorrecte',
  503: 'Service Indisponible',
  504: 'Délai de Passerelle Dépassé'
}

/**
 * All translations map
 */
export const TRANSLATIONS: Record<string, Record<number, string>> = {
  en: HTTP_STATUS_TITLES,
  it: HTTP_STATUS_TITLES_IT,
  es: HTTP_STATUS_TITLES_ES,
  de: HTTP_STATUS_TITLES_DE,
  fr: HTTP_STATUS_TITLES_FR
}

/**
 * Get title for status code in specified language
 */
export function getStatusTitle(status: number, language: string = 'en'): string {
  const titles = TRANSLATIONS[language] || HTTP_STATUS_TITLES
  return titles[status] || HTTP_STATUS_TITLES[status] || 'Unknown Error'
}

/**
 * Get type slug for status code
 */
export function getTypeSlug(status: number): string {
  return HTTP_STATUS_TYPE_SLUGS[status] || `error-${status}`
}

/**
 * Check if status code is a client error (4xx)
 */
export function isClientError(status: number): boolean {
  return status >= 400 && status < 500
}

/**
 * Check if status code is a server error (5xx)
 */
export function isServerError(status: number): boolean {
  return status >= 500 && status < 600
}

/**
 * Check if status code is valid for Problem Details
 */
export function isValidProblemStatus(status: number): boolean {
  return isClientError(status) || isServerError(status)
}
