/**
 * Defines canonical HTTP header names used by Miaixz services.
 *
 * @public
 */
export const miaixzHeaders = Object.freeze({
  authorization: "Authorization",
  csrfToken: "X-CSRF-Token",
  requestId: "X-Request-Id",
  traceId: "X-Miaixz-Trace-Id",
  userId: "X-Miaixz-User-Id",
  tenantId: "X-Miaixz-Tenant-Id",
  organizationId: "X-Miaixz-Organization-Id",
  departmentId: "X-Miaixz-Department-Id",
  spaceId: "X-Miaixz-Space-Id",
  locale: "X-Miaixz-Locale",
  timezone: "X-Miaixz-Timezone",
} as const);

/**
 * Defines canonical browser storage keys used by Miaixz applications.
 *
 * @public
 */
export const miaixzStorageKeys = Object.freeze({
  auth: "miaixz-auth",
  context: "miaixz-context",
  appearance: "miaixz-appearance",
} as const);

/**
 * Defines the default SDK request timeout in milliseconds.
 *
 * @public
 */
export const miaixzDefaultRequestTimeoutMs = 30_000;
