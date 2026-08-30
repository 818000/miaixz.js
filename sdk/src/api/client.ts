import { miaixzDefaultRequestTimeoutMs, miaixzHeaders } from "../consts/index.js";
import { miaixzDefaultI18n, type MiaixzTranslator } from "../i18n/index.js";
import type { MiaixzEnvironment } from "../types/index.js";
import { isRecord } from "../utils/object.js";
import { normalizeMiaixzApiEndpoint } from "./endpoint.js";
import {
  MiaixzAbortError,
  MiaixzApiError,
  MiaixzNetworkError,
  MiaixzSdkError,
  MiaixzTimeoutError,
} from "./errors.js";
import type {
  MiaixzHttpMethod,
  MiaixzPreparedRequest,
  MiaixzQuery,
  MiaixzQueryPrimitive,
  MiaixzRequestBody,
  MiaixzRequestInterceptor,
  MiaixzRequestOptions,
  MiaixzResponseParser,
  MiaixzResponseType,
} from "./request.js";
import {
  isMiaixzApiEnvelope,
  isMiaixzApiSuccess,
  type MiaixzHttpResponse,
  type MiaixzResponseInterceptor,
} from "./response.js";
import type {
  MiaixzApiTelemetryHooks,
  MiaixzErrorEvent,
  MiaixzRequestEvent,
  MiaixzResponseEvent,
} from "./telemetry.js";

/**
 * Supplies a bearer token to the API client on demand.
 *
 * @returns A bearer token, or `undefined` when no token is available.
 * @public
 */
export type MiaixzTokenProvider = () => string | undefined | Promise<string | undefined>;

/**
 * Supplies a complete Authorization header value on demand.
 *
 * @returns A complete Authorization value, or `undefined` when unavailable.
 * @public
 */
export type MiaixzAuthorizationProvider = () => string | undefined | Promise<string | undefined>;

/**
 * Supplies runtime-context headers to the API client on demand.
 *
 * @returns Runtime-context headers, or `undefined` when no context is active.
 * @public
 */
export type MiaixzContextHeadersProvider = () =>
  HeadersInit | undefined | Promise<HeadersInit | undefined>;

/**
 * Supplies a CSRF token to a Cookie/BFF API client on demand.
 *
 * @returns A CSRF token, or `undefined` when no token is available.
 * @public
 */
export type MiaixzCsrfTokenProvider = () => string | undefined | Promise<string | undefined>;

/**
 * Configures authoritative CSRF handling for an API client.
 *
 * @public
 */
export interface MiaixzCsrfOptions {
  /**
   * Determines whether Cookie/BFF write requests require a provider token.
   */
  readonly required: boolean;

  /**
   * Supplies the authoritative token for Cookie/BFF write requests.
   */
  readonly tokenProvider?: MiaixzCsrfTokenProvider;
}

/**
 * Configures a reusable Miaixz API client.
 *
 * @public
 */
export interface MiaixzApiClientOptions {
  /**
   * Base URL used to resolve relative request paths.
   */
  readonly baseUrl: string;

  /**
   * Environment used to validate the endpoint transport policy.
   *
   * @defaultValue "production"
   */
  readonly environment?: MiaixzEnvironment;

  /**
   * Optional Fetch implementation used to send requests.
   */
  readonly fetch?: typeof fetch;

  /**
   * Optional headers included with every request.
   */
  readonly headers?: HeadersInit;

  /**
   * Optional default Fetch credentials mode.
   *
   * @defaultValue "same-origin"
   */
  readonly credentials?: RequestCredentials;

  /**
   * Optional default request timeout in milliseconds.
   *
   * @defaultValue 30000
   */
  readonly timeoutMs?: number;

  /**
   * Optional default number of retry attempts.
   *
   * @defaultValue 0
   */
  readonly retry?: number;
  /**
   * Provides the complete Authorization header value, including its authentication scheme.
   */
  readonly authorizationProvider?: MiaixzAuthorizationProvider;
  /**
   * Provides a bearer token. Ignored when `authorizationProvider` returns a value.
   */
  readonly tokenProvider?: MiaixzTokenProvider;

  /**
   * Optional provider for active runtime-context headers.
   */
  readonly contextHeadersProvider?: MiaixzContextHeadersProvider;

  /**
   * Optional request interceptors executed in registration order.
   */
  readonly requestInterceptors?: readonly MiaixzRequestInterceptor[];

  /**
   * Optional response interceptors executed in registration order.
   */
  readonly responseInterceptors?: readonly MiaixzResponseInterceptor[];

  /**
   * Optional translator used for SDK-generated messages.
   */
  readonly translate?: MiaixzTranslator;

  /**
   * Optional authoritative CSRF policy for Cookie/BFF requests.
   */
  readonly csrf?: MiaixzCsrfOptions;

  /**
   * Optional observers for immutable, redacted request lifecycle events.
   */
  readonly telemetry?: MiaixzApiTelemetryHooks;
}

/**
 * Sends typed requests to Miaixz services.
 *
 * @public
 */
export interface MiaixzApiClient {
  /**
   * Normalized base URL used by the client.
   */
  readonly baseUrl: string;
  /**
   * Sends a request with full method and body control.
   *
   * @typeParam TResponse - Final response-data type.
   * @typeParam TBody - Request-body type.
   * @param path - Relative or slash-relative same-origin request path.
   * @param options - Optional request behavior and response parser.
   * @returns The final parsed HTTP response.
   * @throws MiaixzSdkError When request validation, transport, or response handling fails.
   */
  request<TResponse = unknown, TBody extends MiaixzRequestBody = MiaixzRequestBody>(
    path: string,
    options?: MiaixzRequestOptions<TResponse, TBody>,
  ): Promise<MiaixzHttpResponse<TResponse>>;
  /**
   * Sends a GET request.
   *
   * @typeParam TResponse - Final response-data type.
   * @param path - Relative or slash-relative same-origin request path.
   * @param options - Optional GET behavior and response parser.
   * @returns The final parsed HTTP response.
   * @throws MiaixzSdkError When request validation, transport, or response handling fails.
   */
  get<TResponse = unknown>(
    path: string,
    options?: Omit<MiaixzRequestOptions<TResponse>, "method" | "body">,
  ): Promise<MiaixzHttpResponse<TResponse>>;
  /**
   * Sends a POST request.
   *
   * @typeParam TResponse - Final response-data type.
   * @typeParam TBody - Request-body type.
   * @param path - Relative or slash-relative same-origin request path.
   * @param body - Optional request body.
   * @param options - Optional POST behavior and response parser.
   * @returns The final parsed HTTP response.
   * @throws MiaixzSdkError When request validation, CSRF, transport, or response handling fails.
   */
  post<TResponse = unknown, TBody extends MiaixzRequestBody = MiaixzRequestBody>(
    path: string,
    body?: TBody,
    options?: Omit<MiaixzRequestOptions<TResponse, TBody>, "method" | "body">,
  ): Promise<MiaixzHttpResponse<TResponse>>;
  /**
   * Sends a PUT request.
   *
   * @typeParam TResponse - Final response-data type.
   * @typeParam TBody - Request-body type.
   * @param path - Relative or slash-relative same-origin request path.
   * @param body - Optional request body.
   * @param options - Optional PUT behavior and response parser.
   * @returns The final parsed HTTP response.
   * @throws MiaixzSdkError When request validation, CSRF, transport, or response handling fails.
   */
  put<TResponse = unknown, TBody extends MiaixzRequestBody = MiaixzRequestBody>(
    path: string,
    body?: TBody,
    options?: Omit<MiaixzRequestOptions<TResponse, TBody>, "method" | "body">,
  ): Promise<MiaixzHttpResponse<TResponse>>;
  /**
   * Sends a PATCH request.
   *
   * @typeParam TResponse - Final response-data type.
   * @typeParam TBody - Request-body type.
   * @param path - Relative or slash-relative same-origin request path.
   * @param body - Optional request body.
   * @param options - Optional PATCH behavior and response parser.
   * @returns The final parsed HTTP response.
   * @throws MiaixzSdkError When request validation, CSRF, transport, or response handling fails.
   */
  patch<TResponse = unknown, TBody extends MiaixzRequestBody = MiaixzRequestBody>(
    path: string,
    body?: TBody,
    options?: Omit<MiaixzRequestOptions<TResponse, TBody>, "method" | "body">,
  ): Promise<MiaixzHttpResponse<TResponse>>;
  /**
   * Sends a DELETE request.
   *
   * @typeParam TResponse - Final response-data type.
   * @param path - Relative or slash-relative same-origin request path.
   * @param options - Optional DELETE behavior and response parser.
   * @returns The final parsed HTTP response.
   * @throws MiaixzSdkError When request validation, CSRF, transport, or response handling fails.
   */
  delete<TResponse = unknown>(
    path: string,
    options?: Omit<MiaixzRequestOptions<TResponse>, "method">,
  ): Promise<MiaixzHttpResponse<TResponse>>;
}

const retryableStatuses = new Set([408, 429, 500, 502, 503, 504]);
const retryableMethods = new Set<MiaixzHttpMethod>(["GET", "HEAD", "PUT", "DELETE"]);
const csrfProtectedMethods = new Set<MiaixzHttpMethod>(["POST", "PUT", "PATCH", "DELETE"]);
const contextHeaderNames = new Set([
  miaixzHeaders.traceId.toLowerCase(),
  miaixzHeaders.userId.toLowerCase(),
  miaixzHeaders.tenantId.toLowerCase(),
  miaixzHeaders.organizationId.toLowerCase(),
  miaixzHeaders.departmentId.toLowerCase(),
  miaixzHeaders.spaceId.toLowerCase(),
  miaixzHeaders.locale.toLowerCase(),
  miaixzHeaders.timezone.toLowerCase(),
]);

/**
 * Validates and normalizes an API base URL for the selected environment.
 *
 * @param value - Base URL to validate and normalize.
 * @param environment - Runtime environment controlling HTTP loopback access.
 * @param translate - Translator used for validation failures.
 * @returns Normalized base URL without trailing separators.
 * @throws MiaixzApiError When the endpoint violates the frozen transport policy.
 */
function normalizeBaseUrl(
  value: string,
  environment: MiaixzEnvironment,
  translate: MiaixzTranslator,
): string {
  const normalized = normalizeMiaixzApiEndpoint(value, environment);
  if (normalized === undefined) {
    throw new MiaixzApiError(translate("sdk.error.api.baseUrlInvalid"), {
      status: 0,
      method: "CONFIG",
      url: "[INVALID_URL]",
      code: "API_BASE_URL_INVALID",
    });
  }
  return normalized;
}

/**
 * Validates a positive finite timeout value.
 *
 * @param value - Timeout value in milliseconds.
 * @param translate - Translator used for validation failures.
 * @returns Validated timeout value.
 */
function normalizeTimeout(value: number, translate: MiaixzTranslator): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new MiaixzSdkError(translate("sdk.error.api.timeoutInvalid"), {
      code: "API_TIMEOUT_INVALID",
      details: { timeoutMs: value },
    });
  }
  return value;
}

/**
 * Validates a non-negative integer retry count.
 *
 * @param value - Retry count to validate.
 * @param translate - Translator used for validation failures.
 * @returns Validated retry count.
 */
function normalizeRetry(value: number, translate: MiaixzTranslator): number {
  if (!Number.isInteger(value) || value < 0 || value > 5) {
    throw new MiaixzSdkError(translate("sdk.error.api.retryInvalid"), {
      code: "API_RETRY_INVALID",
      details: { retry: value },
    });
  }
  return value;
}

/**
 * Resolves and validates the response-envelope mode before a request is sent.
 *
 * @param responseType - Response body parser selected by the caller.
 * @param envelope - Optional caller-supplied envelope behavior.
 * @param translate - Translator used for validation failures.
 * @returns The initial envelope mode for the request.
 */
function normalizeEnvelopeMode(
  responseType: MiaixzResponseType,
  envelope: MiaixzRequestOptions["envelope"],
  translate: MiaixzTranslator,
): "required" | "optional" | "none" {
  if (
    (responseType === "text" ||
      responseType === "blob" ||
      responseType === "arrayBuffer" ||
      responseType === "void") &&
    envelope !== undefined &&
    envelope !== "none"
  ) {
    throw new MiaixzSdkError(translate("sdk.error.api.envelopeModeInvalid"), {
      code: "API_ENVELOPE_MODE_INVALID",
    });
  }
  if (
    responseType === "text" ||
    responseType === "blob" ||
    responseType === "arrayBuffer" ||
    responseType === "void"
  ) {
    return "none";
  }
  return envelope ?? "required";
}

/**
 * Creates a stable request-origin validation error without exposing the rejected value.
 *
 * @param translate - Translator used for the public error message.
 * @returns A safe request-origin error.
 */
function createRequestOriginError(translate: MiaixzTranslator): MiaixzSdkError {
  return new MiaixzSdkError(translate("sdk.error.api.requestOriginInvalid"), {
    code: "API_REQUEST_ORIGIN_INVALID",
  });
}

/**
 * Resolves a caller request path while rejecting every absolute or cross-origin form.
 *
 * @param baseUrl - Validated base URL used for relative resolution.
 * @param path - Caller-supplied relative or slash-relative path.
 * @param translate - Translator used for validation failures.
 * @returns A fully resolved URL on the configured origin.
 * @throws MiaixzSdkError When the path is absolute, protocol-relative, or cross-origin.
 */
function resolveRequestUrl(baseUrl: string, path: string, translate: MiaixzTranslator): string {
  if (typeof path !== "string") throw createRequestOriginError(translate);
  const trimmedStart = path.trimStart();
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmedStart) || /^[\\/]{2}/.test(trimmedStart)) {
    throw createRequestOriginError(translate);
  }

  try {
    const base = new URL(baseUrl);
    const resolved = new URL(path, `${baseUrl}/`);
    if (
      resolved.origin !== base.origin ||
      resolved.protocol !== base.protocol ||
      resolved.username !== "" ||
      resolved.password !== ""
    ) {
      throw createRequestOriginError(translate);
    }
    return resolved.href;
  } catch (cause) {
    if (cause instanceof MiaixzSdkError) throw cause;
    throw createRequestOriginError(translate);
  }
}

/**
 * Revalidates an interceptor-produced URL against the configured base origin.
 *
 * @param baseUrl - Validated base URL defining the only permitted origin.
 * @param value - Interceptor-produced URL value.
 * @param translate - Translator used for validation failures.
 * @returns A normalized absolute URL on the configured origin.
 * @throws MiaixzSdkError When the final URL resolves outside the configured origin.
 */
function validatePreparedRequestUrl(
  baseUrl: string,
  value: string,
  translate: MiaixzTranslator,
): string {
  if (typeof value !== "string") throw createRequestOriginError(translate);
  try {
    const base = new URL(baseUrl);
    const resolved = new URL(value, `${baseUrl}/`);
    if (
      resolved.origin !== base.origin ||
      resolved.protocol !== base.protocol ||
      resolved.username !== "" ||
      resolved.password !== ""
    ) {
      throw createRequestOriginError(translate);
    }
    return resolved.href;
  } catch (cause) {
    if (cause instanceof MiaixzSdkError) throw cause;
    throw createRequestOriginError(translate);
  }
}

/**
 * Reports whether the final request contains any runtime-context header.
 *
 * @param headers - Final request headers to inspect.
 * @param providedNames - Header names returned by the configured context provider.
 * @returns Whether at least one context header remains on the request.
 */
function hasContextHeader(headers: Headers, providedNames: ReadonlySet<string>): boolean {
  return [...contextHeaderNames, ...providedNames].some((name) => headers.has(name));
}

/**
 * Computes the mandatory Fetch redirect mode from final authentication and context state.
 *
 * @param headers - Final request headers after interception.
 * @param credentials - Final Fetch credentials mode.
 * @param authenticationEnabled - Whether an authentication integration is active.
 * @param providedContextNames - Header names returned by the context provider.
 * @returns The fixed safe redirect mode for the request.
 */
function resolveRedirectMode(
  headers: Headers,
  credentials: RequestCredentials | undefined,
  authenticationEnabled: boolean,
  providedContextNames: ReadonlySet<string>,
): RequestRedirect {
  return authenticationEnabled ||
    credentials === "include" ||
    headers.has(miaixzHeaders.authorization) ||
    headers.has("Cookie") ||
    headers.has("Proxy-Authorization") ||
    headers.has("X-Api-Key") ||
    headers.has(miaixzHeaders.csrfToken) ||
    hasContextHeader(headers, providedContextNames)
    ? "error"
    : "follow";
}

/**
 * Creates a CSRF failure without retaining provider output or exceptions.
 *
 * @param translate - Translator used for the public error message.
 * @returns A safe missing-token error.
 */
function createCsrfTokenMissingError(translate: MiaixzTranslator): MiaixzSdkError {
  return new MiaixzSdkError(translate("sdk.error.api.csrfTokenMissing"), {
    code: "CSRF_TOKEN_MISSING",
  });
}

/**
 * Applies the authoritative Cookie/BFF CSRF policy to final request headers.
 *
 * @param headers - Final request headers to update.
 * @param method - Final HTTP method used by Fetch.
 * @param csrf - Optional CSRF policy configured on the client.
 * @param translate - Translator used for missing-token failures.
 * @returns Promise settled after the final header policy is applied.
 * @throws MiaixzSdkError When a protected request has no non-empty provider token.
 */
async function applyCsrfPolicy(
  headers: Headers,
  method: MiaixzHttpMethod,
  csrf: MiaixzCsrfOptions | undefined,
  translate: MiaixzTranslator,
): Promise<void> {
  if (csrf?.required !== true) return;
  headers.delete(miaixzHeaders.csrfToken);
  if (!csrfProtectedMethods.has(method)) return;

  let token: string | undefined;
  try {
    token = await csrf.tokenProvider?.();
  } catch {
    throw createCsrfTokenMissingError(translate);
  }
  if (typeof token !== "string" || token.trim().length === 0) {
    throw createCsrfTokenMissingError(translate);
  }
  headers.set(miaixzHeaders.csrfToken, token.trim());
}

/**
 * Converts query primitives to their URL representation.
 *
 * @param value - Query value to serialize.
 * @returns URL-compatible string representation.
 */
function serializeQueryValue(value: Exclude<MiaixzQueryPrimitive, null | undefined>): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

/**
 * Appends scalar or repeated query values without disturbing an existing hash.
 * `null` and `undefined` values are omitted.
 *
 * @param url - Request URL to update.
 * @param query - Optional query parameters to append.
 * @returns URL containing the serialized query parameters.
 * @public
 */
export function appendMiaixzQuery(url: string, query?: MiaixzQuery): string {
  if (!query) return url;
  const hashIndex = url.indexOf("#");
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
  const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const parameters = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(query)) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) {
      if (value !== null && value !== undefined) parameters.append(key, serializeQueryValue(value));
    }
  }
  const serialized = parameters.toString();
  if (!serialized) return url;
  return `${base}${base.includes("?") ? "&" : "?"}${serialized}${hash}`;
}

/**
 * Detects body types that Fetch can transmit without JSON serialization.
 *
 * @param value - Request body candidate to inspect.
 * @returns Whether the value is a native Fetch body.
 */
function isNativeBody(value: unknown): value is BodyInit {
  return (
    typeof value === "string" ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    (typeof ReadableStream !== "undefined" && value instanceof ReadableStream)
  );
}

/**
 * Serializes plain records and arrays as JSON while preserving native bodies.
 *
 * @param body - Optional request body to serialize.
 * @param headers - Request headers updated with a JSON content type when needed.
 * @returns Native or serialized body accepted by Fetch.
 */
function serializeBody(
  body: MiaixzRequestBody | undefined,
  headers: Headers,
): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (isNativeBody(body)) return body;
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return JSON.stringify(body);
}

/**
 * Reads the standard or legacy request identifier header.
 *
 * @param headers - Response headers to inspect.
 * @returns Request identifier when the server supplied one.
 */
function getRequestId(headers: Headers): string | undefined {
  return headers.get(miaixzHeaders.requestId) ?? headers.get("x-request-id") ?? undefined;
}

/**
 * Determines whether the selected response mode represents a JSON API response.
 *
 * @param response - HTTP response to inspect.
 * @param responseType - Configured response parsing mode.
 * @returns Whether the response is expected to contain a JSON envelope.
 */
function expectsJsonEnvelope(response: Response, responseType: MiaixzResponseType): boolean {
  if (response.status === 204 || response.status === 205 || responseType === "void") return false;
  if (responseType === "json") return true;
  if (responseType !== "auto") return false;
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  return contentType.includes("json") || contentType.includes("+json");
}

/**
 * Parses a response using the explicit mode or its Content-Type header.
 *
 * @param response - HTTP response whose body should be parsed.
 * @param responseType - Configured response parsing mode.
 * @returns Parsed response body.
 */
async function parseBody(response: Response, responseType: MiaixzResponseType): Promise<unknown> {
  if (responseType === "void" || response.status === 204 || response.status === 205)
    return undefined;
  if (responseType === "blob") return response.blob();
  if (responseType === "arrayBuffer") return response.arrayBuffer();
  if (responseType === "text") return response.text();
  if (responseType === "json") return parseJsonBody(response);
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("json") || contentType.includes("+json")) return parseJsonBody(response);
  if (contentType.startsWith("text/")) return response.text();
  return response.blob();
}

/**
 * Parses JSON while distinguishing an empty body from malformed non-empty JSON.
 *
 * @param response - JSON response to parse.
 * @returns Parsed JSON, or undefined when the body is empty.
 */
async function parseJsonBody(response: Response): Promise<unknown> {
  const fallback = response.clone();
  try {
    return await response.json();
  } catch (cause) {
    const text = await fallback.text().catch(() => undefined);
    if (text === "") return undefined;
    throw cause;
  }
}

interface MiaixzProblemDetails {
  /**
   * Optional machine-readable failure code.
   */
  code?: string;

  /**
   * Optional request identifier used for diagnostics.
   */
  requestId?: string;
}

/**
 * Normalizes an unsuccessful HTTP body into stable problem details.
 *
 * @param body - Parsed unsuccessful response body.
 * @param response - Original HTTP response.
 * @returns Stable problem details extracted from the response.
 */
function extractProblem(body: unknown, response: Response): MiaixzProblemDetails {
  if (isMiaixzApiEnvelope(body)) {
    return {
      code: isMiaixzApiSuccess(body) ? `HTTP_${response.status}` : String(body.errcode),
    };
  }
  if (!isRecord(body)) return {};
  const result: MiaixzProblemDetails = {};
  if (typeof body.code === "string") result.code = body.code;
  if (typeof body.requestId === "string") result.requestId = body.requestId;
  return result;
}

/**
 * Removes URL credentials, fragments, and query values before an error exposes the URL.
 *
 * @param value - Absolute request URL to sanitize.
 * @returns URL containing only origin, path, and redacted query keys.
 */
function sanitizeErrorUrl(value: string): string {
  try {
    const url = new URL(value);
    const query = [...url.searchParams.keys()].map(
      (key) => `${encodeURIComponent(key)}=[REDACTED]`,
    );
    return `${url.origin}${url.pathname}${query.length > 0 ? `?${query.join("&")}` : ""}`;
  } catch {
    return "[INVALID_URL]";
  }
}

/**
 * Wraps response parsing or runtime validation failures in the frozen SDK error contract.
 *
 * @param cause - Parser failure to preserve when it is an Error instance.
 * @param requestId - Optional server request identifier.
 * @param translate - Translator used for the public error message.
 * @returns Structured response-validation error.
 */
function createResponseInvalidError(
  cause: unknown,
  requestId: string | undefined,
  translate: MiaixzTranslator,
): MiaixzSdkError {
  const details = {
    ...(requestId === undefined ? {} : { requestId }),
    ...(cause instanceof Error ? {} : { type: typeof cause }),
  };
  return new MiaixzSdkError(translate("sdk.error.api.responseInvalid"), {
    code: "API_RESPONSE_INVALID",
    cause,
    ...(Object.keys(details).length === 0 ? {} : { details: Object.freeze(details) }),
  });
}

/**
 * Applies an optional runtime response parser after all response interceptors.
 *
 * @typeParam T - Verified response value returned to the caller.
 * @param value - Untrusted response value after interception.
 * @param parser - Optional application runtime parser.
 * @param requestId - Optional server request identifier.
 * @param translate - Translator used for parser failures.
 * @returns Parsed response data, or the compatibility generic value when no parser exists.
 */
function parseResponseData<T>(
  value: unknown,
  parser: MiaixzResponseParser<T> | undefined,
  requestId: string | undefined,
  translate: MiaixzTranslator,
): T {
  if (!parser) return value as T;
  try {
    return parser(value);
  } catch (cause) {
    throw createResponseInvalidError(cause, requestId, translate);
  }
}

/**
 * Provides cancellation state and cleanup for a timed request.
 */
interface MiaixzAbortContext {
  /**
   * Signal passed to Fetch for combined cancellation and timeout handling.
   */
  signal: AbortSignal;

  /**
   * Reports whether the configured timeout triggered cancellation.
   */
  timedOut: () => boolean;

  /**
   * Removes listeners and clears the timeout.
   */
  dispose: () => void;
}

/**
 * Combines caller cancellation with an SDK timeout and returns cleanup controls.
 *
 * @param signal - Optional cancellation signal supplied by the caller.
 * @param timeoutMs - Timeout threshold in milliseconds.
 * @returns Combined abort context and cleanup controls.
 */
function createAbortContext(
  signal: AbortSignal | undefined,
  timeoutMs: number,
): MiaixzAbortContext {
  const controller = new AbortController();
  let didTimeout = false;
  const abortFromParent = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abortFromParent, { once: true });
  if (signal?.aborted) abortFromParent();
  const timeout = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, timeoutMs);
  return {
    signal: controller.signal,
    timedOut: () => didTimeout,
    dispose: () => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abortFromParent);
    },
  };
}

/**
 * Calculates Retry-After or bounded exponential backoff in milliseconds.
 *
 * @param attempt - Zero-based retry attempt number.
 * @param response - Optional response containing a Retry-After header.
 * @returns Delay in milliseconds before the next retry.
 */
function retryDelay(attempt: number, response?: Response): number {
  const retryAfter = response?.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const timestamp = Date.parse(retryAfter);
    if (Number.isFinite(timestamp)) return Math.max(0, timestamp - Date.now());
  }
  return Math.min(250 * 2 ** attempt, 2_000);
}

/**
 * Waits for a retry delay while remaining cancellable by the caller.
 *
 * @param milliseconds - Delay duration in milliseconds.
 * @param signal - Optional cancellation signal supplied by the caller.
 * @param translate - Translator used for cancellation errors.
 * @returns Promise that resolves after the delay.
 */
async function wait(
  milliseconds: number,
  signal: AbortSignal | undefined,
  translate: MiaixzTranslator,
): Promise<void> {
  if (milliseconds <= 0) return;
  if (signal?.aborted) throw new MiaixzAbortError(signal.reason, translate);
  await new Promise<void>((resolve, reject) => {
    const complete = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const timeout = setTimeout(complete, milliseconds);
    const abort = () => {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
      reject(new MiaixzAbortError(signal?.reason, translate));
    };
    signal?.addEventListener("abort", abort, { once: true });
  });
}

const sensitiveHeaderNames = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-csrf-token",
  "proxy-authorization",
]);
const sensitiveFieldNames = new Set([
  "token",
  "accesstoken",
  "refreshtoken",
  "password",
  "secret",
  "apikey",
  "key",
]);
const telemetryMaximumDepth = 8;
const telemetryMaximumCollectionSize = 100;
const telemetryMaximumStringLength = 1_024;
const redactedValue = "[REDACTED]";
const truncatedValue = "[TRUNCATED]";
const circularValue = "[CIRCULAR]";

/**
 * Describes a non-JSON value without retaining its content.
 */
interface MiaixzTelemetryValueSummary {
  /**
   * Contains the runtime value category.
   */
  readonly type: string;

  /**
   * Contains the measurable byte size, or undefined when size cannot be determined safely.
   */
  readonly bytes: number | undefined;
}

/**
 * Reports whether an object can be traversed without invoking custom collection behavior.
 *
 * @param value - Object candidate to inspect.
 * @returns Whether the value is an object literal or null-prototype record.
 */
function isPlainTelemetryObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * Normalizes a field name before comparing it with the sensitive-name registry.
 *
 * @param value - Field name to normalize.
 * @returns Lowercase field name without separators.
 */
function normalizeSensitiveFieldName(value: string): string {
  return value.replace(/[-_]/g, "").toLowerCase();
}

/**
 * Truncates a string by Unicode code points rather than UTF-16 code units.
 *
 * @param value - String value to limit.
 * @returns Original or safely truncated string.
 */
function truncateTelemetryString(value: string): string {
  const characters = [...value];
  if (characters.length <= telemetryMaximumStringLength) return value;
  return `${characters.slice(0, telemetryMaximumStringLength).join("")}${truncatedValue}`;
}

/**
 * Creates a fixed safe summary for a non-JSON request-body value.
 *
 * @param value - Value whose content must not be recorded.
 * @returns Frozen type and byte-size summary.
 */
function summarizeTelemetryValue(value: unknown): Readonly<MiaixzTelemetryValueSummary> {
  let type: string = typeof value;
  let bytes: number | undefined;
  if (typeof value === "string") {
    type = "string";
    bytes = new TextEncoder().encode(value).byteLength;
  } else if (value instanceof URLSearchParams) {
    type = "URLSearchParams";
    bytes = new TextEncoder().encode(value.toString()).byteLength;
  } else if (value instanceof Blob) {
    type = value.constructor.name || "Blob";
    bytes = value.size;
  } else if (value instanceof ArrayBuffer) {
    type = "ArrayBuffer";
    bytes = value.byteLength;
  } else if (ArrayBuffer.isView(value)) {
    type = value.constructor.name;
    bytes = value.byteLength;
  } else if (value instanceof FormData) {
    type = "FormData";
  } else if (typeof ReadableStream !== "undefined" && value instanceof ReadableStream) {
    type = "ReadableStream";
  } else if (value !== null && typeof value === "object") {
    type = value.constructor?.name || "Object";
  }
  return Object.freeze({ type, bytes });
}

/**
 * Recursively creates a bounded, getter-safe telemetry snapshot.
 *
 * @param value - Runtime value to sanitize.
 * @param depth - Current recursion depth.
 * @param ancestors - Objects in the active traversal path.
 * @returns Frozen safe telemetry value.
 */
function sanitizeTelemetryValue(
  value: unknown,
  depth = 0,
  ancestors: ReadonlySet<object> = new Set(),
): unknown {
  if (typeof value === "string") return truncateTelemetryString(value);
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "undefined"
  ) {
    return value;
  }
  if (typeof value !== "object") return summarizeTelemetryValue(value);
  if (ancestors.has(value)) return circularValue;
  if (depth >= telemetryMaximumDepth) return truncatedValue;
  if (!Array.isArray(value) && !isPlainTelemetryObject(value)) {
    return summarizeTelemetryValue(value);
  }
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);
  if (Array.isArray(value)) {
    const limit = Math.min(value.length, telemetryMaximumCollectionSize);
    const result: unknown[] = [];
    for (let index = 0; index < limit; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      result.push(
        descriptor && "value" in descriptor
          ? sanitizeTelemetryValue(descriptor.value, depth + 1, nextAncestors)
          : truncatedValue,
      );
    }
    if (value.length > telemetryMaximumCollectionSize) {
      result[telemetryMaximumCollectionSize - 1] = truncatedValue;
    }
    return Object.freeze(result);
  }
  const result: Record<string, unknown> = {};
  const keys = Object.keys(value);
  const limit = Math.min(keys.length, telemetryMaximumCollectionSize);
  for (let index = 0; index < limit; index += 1) {
    const key = keys[index];
    if (key === undefined) continue;
    if (sensitiveFieldNames.has(normalizeSensitiveFieldName(key))) {
      result[key] = redactedValue;
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    result[key] =
      descriptor && "value" in descriptor
        ? sanitizeTelemetryValue(descriptor.value, depth + 1, nextAncestors)
        : truncatedValue;
  }
  if (keys.length > telemetryMaximumCollectionSize) {
    const lastKey = keys[telemetryMaximumCollectionSize - 1];
    if (lastKey !== undefined) result[lastKey] = truncatedValue;
  }
  return Object.freeze(result);
}

/**
 * Sanitizes a request body while reducing every non-JSON body to a safe summary.
 *
 * @param body - Original or interceptor-produced request body.
 * @returns Frozen redacted JSON value or fixed non-JSON body summary.
 */
function sanitizeTelemetryBody(body: unknown): unknown {
  if (
    body !== null &&
    typeof body === "object" &&
    (Array.isArray(body) || isPlainTelemetryObject(body))
  ) {
    return sanitizeTelemetryValue(body);
  }
  return summarizeTelemetryValue(body);
}

/**
 * Creates a frozen case-insensitive redacted header snapshot.
 *
 * @param headers - Headers to copy without exposing credentials.
 * @returns Frozen safe header record.
 */
function sanitizeTelemetryHeaders(
  headers: HeadersInit | undefined,
): Readonly<Record<string, string>> {
  const result: Record<string, string> = {};
  new Headers(headers).forEach((value, key) => {
    result[key] = sensitiveHeaderNames.has(key.toLowerCase()) ? redactedValue : value;
  });
  return Object.freeze(result);
}

/**
 * Removes URL credentials, fragments, and query values for telemetry events.
 *
 * @param value - Absolute request URL to sanitize.
 * @returns Safe URL containing only origin, path, and redacted query keys.
 */
function sanitizeTelemetryUrl(value: string): string {
  return sanitizeErrorUrl(value);
}

/**
 * Resolves or securely creates the logical request identifier.
 *
 * @param headers - Request headers that receive a generated identifier.
 * @param translate - Translator used for secure-random failures.
 * @returns Caller-supplied or newly generated request identifier.
 * @throws MiaixzSdkError When secure random UUID generation is unavailable.
 */
function resolveLogicalRequestId(headers: Headers, translate: MiaixzTranslator): string {
  const inherited = headers.get(miaixzHeaders.requestId);
  if (inherited) return inherited;
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new MiaixzSdkError(translate("sdk.error.api.cryptoUnavailable"), {
      code: "API_CRYPTO_UNAVAILABLE",
    });
  }
  const requestId = globalThis.crypto.randomUUID();
  headers.set(miaixzHeaders.requestId, requestId);
  return requestId;
}

/**
 * Invokes one primary telemetry hook without allowing it to affect request behavior.
 *
 * @typeParam T - Immutable telemetry event type.
 * @param telemetry - Optional host-provided telemetry hooks.
 * @param hookName - Primary hook identifier used for error reporting.
 * @param hook - Primary hook to invoke.
 * @param event - Frozen event delivered to the hook.
 * @returns Promise settled after the hook and any hook-error observer finish.
 */
async function invokeTelemetryHook<T>(
  telemetry: MiaixzApiTelemetryHooks | undefined,
  hookName: "request" | "response" | "error",
  hook: ((event: Readonly<T>) => void | Promise<void>) | undefined,
  event: Readonly<T>,
): Promise<void> {
  if (!hook) return;
  try {
    await hook(event);
  } catch (error) {
    try {
      telemetry?.onHookError?.(error, hookName);
    } catch {
      // Telemetry is observational; a secondary hook failure is intentionally ignored.
    }
  }
}

/**
 * Converts an unknown attempt failure to the stable public SDK error model.
 *
 * @param error - Failure caught during the request attempt.
 * @param abortContext - Attempt timeout state.
 * @param callerSignal - Optional caller cancellation signal.
 * @param timeoutMs - Attempt timeout threshold.
 * @param translate - Translator used for normalized errors.
 * @returns Stable SDK error for both telemetry and the request caller.
 */
function normalizeAttemptError(
  error: unknown,
  abortContext: MiaixzAbortContext,
  callerSignal: AbortSignal | undefined,
  timeoutMs: number,
  translate: MiaixzTranslator,
): MiaixzSdkError {
  if (error instanceof MiaixzSdkError) return error;
  if (abortContext.timedOut()) return new MiaixzTimeoutError(timeoutMs, error, translate);
  if (callerSignal?.aborted) return new MiaixzAbortError(error, translate);
  return new MiaixzNetworkError(error, translate);
}

/**
 * Creates and delivers a frozen request telemetry event.
 *
 * @param telemetry - Optional host-provided telemetry hooks.
 * @param requestId - Logical request identifier.
 * @param method - Request method.
 * @param prepared - Final request produced by interceptors.
 * @param body - Original or interceptor-produced request body.
 * @param startedAt - Attempt start timestamp.
 * @returns Promise settled after telemetry observation completes.
 */
async function emitRequestTelemetry(
  telemetry: MiaixzApiTelemetryHooks | undefined,
  requestId: string,
  method: MiaixzHttpMethod,
  prepared: MiaixzPreparedRequest,
  body: unknown,
  startedAt: number,
): Promise<void> {
  const event: MiaixzRequestEvent = Object.freeze({
    requestId,
    method,
    url: sanitizeTelemetryUrl(prepared.url),
    attempt: prepared.attempt,
    headers: sanitizeTelemetryHeaders(prepared.init.headers),
    ...(body === undefined ? {} : { body: sanitizeTelemetryBody(body) }),
    startedAt,
  });
  await invokeTelemetryHook(telemetry, "request", telemetry?.onRequest, event);
}

/**
 * Creates and delivers a frozen response telemetry event.
 *
 * @param telemetry - Optional host-provided telemetry hooks.
 * @param requestId - Logical request identifier.
 * @param method - Request method.
 * @param prepared - Final request produced by interceptors.
 * @param response - Raw Fetch response.
 * @param startedAt - Attempt start timestamp.
 * @returns Promise settled after telemetry observation completes.
 */
async function emitResponseTelemetry(
  telemetry: MiaixzApiTelemetryHooks | undefined,
  requestId: string,
  method: MiaixzHttpMethod,
  prepared: MiaixzPreparedRequest,
  response: Response,
  startedAt: number,
): Promise<void> {
  const event: MiaixzResponseEvent = Object.freeze({
    requestId,
    method,
    url: sanitizeTelemetryUrl(prepared.url),
    attempt: prepared.attempt,
    status: response.status,
    durationMs: Math.max(0, Date.now() - startedAt),
    headers: sanitizeTelemetryHeaders(response.headers),
  });
  await invokeTelemetryHook(telemetry, "response", telemetry?.onResponse, event);
}

/**
 * Creates and delivers a frozen failure telemetry event.
 *
 * @param telemetry - Optional host-provided telemetry hooks.
 * @param requestId - Logical request identifier.
 * @param method - Request method.
 * @param prepared - Final request produced by interceptors.
 * @param error - Normalized SDK error.
 * @param startedAt - Attempt start timestamp.
 * @returns Promise settled after telemetry observation completes.
 */
async function emitErrorTelemetry(
  telemetry: MiaixzApiTelemetryHooks | undefined,
  requestId: string,
  method: MiaixzHttpMethod,
  prepared: MiaixzPreparedRequest,
  error: MiaixzSdkError,
  startedAt: number,
): Promise<void> {
  const summary = Object.freeze({ name: error.name, code: error.code, message: error.message });
  const event: MiaixzErrorEvent = Object.freeze({
    requestId,
    method,
    url: sanitizeTelemetryUrl(prepared.url),
    attempt: prepared.attempt,
    durationMs: Math.max(0, Date.now() - startedAt),
    error: summary,
  });
  await invokeTelemetryHook(telemetry, "error", telemetry?.onError, event);
}

/**
 * Creates a Fetch-based API client with auth, runtime context, retries, i18n,
 * and automatic `{ errcode, errmsg, data }` validation and data unwrapping.
 *
 * @param options - Endpoint and runtime adapters shared by all requests.
 * @returns A reusable typed client whose response `data` is already unwrapped.
 * @throws MiaixzApiError When the configured base URL violates the endpoint policy.
 * @throws MiaixzSdkError When no Fetch implementation is available.
 * @public
 */
export function createApiClient(options: MiaixzApiClientOptions): MiaixzApiClient {
  const translate = options.translate ?? miaixzDefaultI18n.t;
  const environment = options.environment ?? "production";
  const baseUrl = normalizeBaseUrl(options.baseUrl, environment, translate);
  const fetchImplementation = options.fetch ?? globalThis.fetch;
  if (!fetchImplementation) {
    throw new MiaixzSdkError(translate("sdk.error.api.fetchUnavailable"), {
      code: "FETCH_UNAVAILABLE",
    });
  }

  const request = async <TResponse, TBody extends MiaixzRequestBody = MiaixzRequestBody>(
    path: string,
    requestOptions: MiaixzRequestOptions<TResponse, TBody> = {},
  ): Promise<MiaixzHttpResponse<TResponse>> => {
    const method = requestOptions.method ?? "GET";
    const url = appendMiaixzQuery(
      resolveRequestUrl(baseUrl, path, translate),
      requestOptions.query,
    );
    const timeoutMs = normalizeTimeout(
      requestOptions.timeoutMs ?? options.timeoutMs ?? miaixzDefaultRequestTimeoutMs,
      translate,
    );
    const maximumRetries = normalizeRetry(requestOptions.retry ?? options.retry ?? 0, translate);
    const responseType = requestOptions.responseType ?? "auto";
    const envelopeMode = normalizeEnvelopeMode(responseType, requestOptions.envelope, translate);
    const headers = new Headers(options.headers);
    const providedContextHeaderNames = new Set<string>();
    new Headers(requestOptions.headers).forEach((value, key) => headers.set(key, value));
    const authenticationEnabled =
      requestOptions.authenticate !== false &&
      (options.authorizationProvider !== undefined ||
        options.tokenProvider !== undefined ||
        options.csrf?.required === true);
    if (requestOptions.authenticate !== false) {
      const authorization = await options.authorizationProvider?.();
      const token = authorization ? undefined : await options.tokenProvider?.();
      if (!headers.has(miaixzHeaders.authorization)) {
        if (authorization) headers.set(miaixzHeaders.authorization, authorization);
        else if (token) headers.set(miaixzHeaders.authorization, `Bearer ${token}`);
      }
    }
    if (requestOptions.includeContext !== false) {
      const contextHeaders = await options.contextHeadersProvider?.();
      new Headers(contextHeaders).forEach((value, key) => {
        providedContextHeaderNames.add(key.toLowerCase());
        if (!headers.has(key)) headers.set(key, value);
      });
    }
    const logicalRequestId = resolveLogicalRequestId(headers, translate);
    const body = serializeBody(requestOptions.body, headers);
    let attempt = 0;

    while (true) {
      const startedAt = Date.now();
      const abortContext = createAbortContext(requestOptions.signal, timeoutMs);
      let prepared: MiaixzPreparedRequest = {
        url,
        attempt,
        init: {
          method,
          headers,
          credentials: requestOptions.credentials ?? options.credentials ?? "same-origin",
          signal: abortContext.signal,
          ...(body === undefined ? {} : { body }),
        },
      };
      try {
        for (const interceptor of options.requestInterceptors ?? [])
          prepared = await interceptor(prepared);
        const preparedUrl = validatePreparedRequestUrl(baseUrl, prepared.url, translate);
        const preparedHeaders = new Headers(prepared.init.headers);
        const preparedMethod = String(
          prepared.init.method ?? method,
        ).toUpperCase() as MiaixzHttpMethod;
        await applyCsrfPolicy(preparedHeaders, preparedMethod, options.csrf, translate);
        preparedHeaders.set(miaixzHeaders.requestId, logicalRequestId);
        const redirect = resolveRedirectMode(
          preparedHeaders,
          prepared.init.credentials,
          authenticationEnabled,
          providedContextHeaderNames,
        );
        prepared = {
          ...prepared,
          url: preparedUrl,
          attempt,
          init: { ...prepared.init, headers: preparedHeaders, redirect },
        };
        await emitRequestTelemetry(
          options.telemetry,
          logicalRequestId,
          method,
          prepared,
          prepared.init.body === body ? requestOptions.body : prepared.init.body,
          startedAt,
        );
        const rawResponse = await fetchImplementation(prepared.url, prepared.init);
        await emitResponseTelemetry(
          options.telemetry,
          logicalRequestId,
          method,
          prepared,
          rawResponse,
          startedAt,
        );
        let parsedBody: unknown;
        try {
          parsedBody = await parseBody(rawResponse, rawResponse.ok ? responseType : "auto");
        } catch (cause) {
          if (rawResponse.ok) {
            throw createResponseInvalidError(cause, getRequestId(rawResponse.headers), translate);
          }
          parsedBody = undefined;
        }
        if (!rawResponse.ok) {
          const problem = extractProblem(parsedBody, rawResponse);
          const responseRequestId = problem.requestId ?? getRequestId(rawResponse.headers);
          const httpError = new MiaixzApiError(
            translate("sdk.error.http", { status: rawResponse.status }),
            {
              status: rawResponse.status,
              method,
              url: sanitizeErrorUrl(prepared.url),
              code: problem.code ?? `HTTP_${rawResponse.status}`,
              ...(responseRequestId === undefined ? {} : { requestId: responseRequestId }),
              retryable: retryableStatuses.has(rawResponse.status),
            },
          );
          const shouldRetry =
            attempt < maximumRetries &&
            retryableMethods.has(method) &&
            retryableStatuses.has(rawResponse.status);
          if (shouldRetry) {
            await emitErrorTelemetry(
              options.telemetry,
              logicalRequestId,
              method,
              prepared,
              httpError,
              startedAt,
            );
            await wait(retryDelay(attempt, rawResponse), requestOptions.signal, translate);
            attempt += 1;
            continue;
          }
          throw httpError;
        }
        const envelope = isMiaixzApiEnvelope(parsedBody) ? parsedBody : undefined;
        const effectiveEnvelopeMode =
          responseType === "auto" && !expectsJsonEnvelope(rawResponse, responseType)
            ? "none"
            : envelopeMode;
        if (
          effectiveEnvelopeMode === "required" &&
          expectsJsonEnvelope(rawResponse, responseType) &&
          envelope === undefined
        ) {
          const invalidEnvelopeRequestId = getRequestId(rawResponse.headers);
          throw new MiaixzApiError(translate("sdk.error.api.envelopeInvalid"), {
            status: rawResponse.status,
            method,
            url: sanitizeErrorUrl(prepared.url),
            code: "API_ENVELOPE_INVALID",
            ...(invalidEnvelopeRequestId === undefined
              ? {}
              : { requestId: invalidEnvelopeRequestId }),
            retryable: false,
          });
        }
        if (
          effectiveEnvelopeMode !== "none" &&
          envelope !== undefined &&
          !isMiaixzApiSuccess(envelope)
        ) {
          const businessRequestId = getRequestId(rawResponse.headers);
          const businessCode = String(envelope.errcode);
          throw new MiaixzApiError(translate("sdk.error.api.business"), {
            status: rawResponse.status,
            method,
            url: sanitizeErrorUrl(prepared.url),
            code: businessCode,
            ...(businessRequestId === undefined ? {} : { requestId: businessRequestId }),
            retryable: false,
          });
        }
        const requestId = getRequestId(rawResponse.headers);
        let result: MiaixzHttpResponse<unknown> = {
          data:
            effectiveEnvelopeMode !== "none" && envelope !== undefined ? envelope.data : parsedBody,
          status: rawResponse.status,
          statusText: rawResponse.statusText,
          headers: rawResponse.headers,
          url: rawResponse.url || prepared.url,
          ...(requestId === undefined ? {} : { requestId }),
        };
        for (const interceptor of options.responseInterceptors ?? [])
          result = await interceptor(result);
        const data = parseResponseData(
          result.data,
          requestOptions.parse,
          result.requestId,
          translate,
        );
        return Object.freeze({ ...result, data });
      } catch (error) {
        const normalizedError = normalizeAttemptError(
          error,
          abortContext,
          requestOptions.signal,
          timeoutMs,
          translate,
        );
        await emitErrorTelemetry(
          options.telemetry,
          logicalRequestId,
          method,
          prepared,
          normalizedError,
          startedAt,
        );
        const shouldRetryNetwork =
          !(error instanceof MiaixzSdkError) &&
          !abortContext.timedOut() &&
          !requestOptions.signal?.aborted &&
          attempt < maximumRetries &&
          retryableMethods.has(method);
        if (shouldRetryNetwork) {
          try {
            await wait(retryDelay(attempt), requestOptions.signal, translate);
          } catch (delayError) {
            const normalizedDelayError =
              delayError instanceof MiaixzSdkError
                ? delayError
                : new MiaixzAbortError(delayError, translate);
            await emitErrorTelemetry(
              options.telemetry,
              logicalRequestId,
              method,
              prepared,
              normalizedDelayError,
              startedAt,
            );
            throw normalizedDelayError;
          }
          attempt += 1;
          continue;
        }
        throw normalizedError;
      } finally {
        abortContext.dispose();
      }
    }
  };

  return {
    baseUrl,
    request,
    get: (path, requestOptions) => request(path, { ...requestOptions, method: "GET" }),
    post: (path, body, requestOptions) =>
      request(path, { ...requestOptions, method: "POST", ...(body === undefined ? {} : { body }) }),
    put: (path, body, requestOptions) =>
      request(path, { ...requestOptions, method: "PUT", ...(body === undefined ? {} : { body }) }),
    patch: (path, body, requestOptions) =>
      request(path, {
        ...requestOptions,
        method: "PATCH",
        ...(body === undefined ? {} : { body }),
      }),
    delete: (path, requestOptions) => request(path, { ...requestOptions, method: "DELETE" }),
  };
}
