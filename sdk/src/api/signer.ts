/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

/* eslint-disable jsdoc/require-jsdoc
 */

import type { MiaixzApiClient } from "./client.js";
import { MiaixzApiError, MiaixzSdkError } from "./errors.js";
import type { MiaixzHttpMethod, MiaixzResponseParser } from "./request.js";
import type { MiaixzHttpResponse } from "./response.js";

/**
 * Represents a JSON-compatible value accepted by the REST gateway.
 *
 * @public
 */
export type RestJsonValue =
  | string
  | number
  | boolean
  | ReadonlyArray<RestJsonValue>
  | { readonly [key: string]: RestJsonValue };

/**
 * Maps REST gateway parameter names to supported values.
 *
 * @public
 */
export type RestGatewayParameters = Readonly<Record<string, RestJsonValue>>;

/**
 * Represents authentication material used to sign a REST gateway request.
 *
 * @public
 */
export type RestSignatureAuth =
  | { readonly mode: "legacy" }
  | { readonly mode: "v1-token"; readonly token: string }
  | { readonly mode: "v1-apikey"; readonly apiKey: string };

/**
 * Configures one REST gateway signature.
 *
 * @public
 */
export interface RestSignInput {
  /**
   * HTTP method used to send the request.
   */
  readonly httpMethod: MiaixzHttpMethod;

  /**
   * Gateway parameters, including method, v, format, and timestamp.
   */
  readonly parameters: RestGatewayParameters & {
    readonly method: string;
    readonly v: string;
    readonly format: string;
    readonly timestamp: string;
  };

  /**
   * Authentication mode and credential.
   */
  readonly auth: RestSignatureAuth;
}

/**
 * Configures one signed REST gateway request.
 *
 * @typeParam TResponse - Parsed response payload type.
 * @public
 */
export interface RestGatewayRequestInput<TResponse> {
  /**
   * HTTP method used by the gateway request.
   */
  readonly httpMethod: "GET" | "POST";

  /**
   * Business parameters. The adapter creates timestamp and sign.
   */
  readonly parameters: RestGatewayParameters & {
    readonly method: string;
    readonly v: string;
    readonly format: string;
  };

  /**
   * Authentication material or a provider evaluated once for this request.
   */
  readonly auth: RestSignatureAuth | (() => RestSignatureAuth | Promise<RestSignatureAuth>);

  /**
   * Optional parser applied after the Miaixz envelope is unwrapped.
   */
  readonly parse?: MiaixzResponseParser<TResponse>;
}

/**
 * Configures a REST gateway request adapter.
 *
 * @public
 */
export interface RestGatewayClientOptions {
  /**
   * API client used to perform the same-origin request.
   */
  readonly api: MiaixzApiClient;

  /**
   * Gateway path.
   *
   * @defaultValue "/router/rest"
   */
  readonly path?: string;

  /**
   * Clock used to create the millisecond timestamp.
   */
  readonly now?: () => number;

  /**
   * Callback invoked when the gateway reports an expired or unauthorized session.
   */
  readonly onAuthenticationExpired?: () => void;
}

const SUPPORTED_HTTP_METHODS = new Set<MiaixzHttpMethod>([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);
const TOKEN_MAX_LENGTH = 8_192;
const API_KEY_MAX_LENGTH = 512;
const REQUIRED_PARAMETERS = ["method", "v", "format", "timestamp"] as const;
const encoder = new TextEncoder();

/**
 * Creates signatures for the Miaixz REST gateway protocol.
 *
 * @public
 */
export class Signer {
  /**
   * Creates the standard Base64 signature for one request.
   *
   * @param input - HTTP method, parameters, and authentication material.
   * @returns The standard Base64 HMAC-SHA256 signature.
   */
  async sign(input: RestSignInput): Promise<string> {
    const httpMethod = normalizeHttpMethod(input.httpMethod);
    const canonical = canonicalize(input.parameters);
    const key = await deriveSigningKey(input.auth, input.parameters);
    const signature = await hmacSha256(key, encoder.encode(`${httpMethod}\n${canonical}`));
    return encodeBase64(signature);
  }
}

/**
 * Signs and sends requests to the Miaixz REST gateway.
 *
 * @public
 */
export class RestGatewayClient {
  readonly #api: MiaixzApiClient;
  readonly #path: string;
  readonly #now: () => number;
  readonly #onAuthenticationExpired: (() => void) | undefined;
  readonly #signer = new Signer();

  /**
   * Creates a REST gateway request adapter.
   *
   * @param options - API client, gateway path, and optional clock.
   */
  constructor(options: RestGatewayClientOptions) {
    this.#api = options.api;
    this.#path = options.path ?? "/router/rest";
    this.#now = options.now ?? Date.now;
    this.#onAuthenticationExpired = options.onAuthenticationExpired;
  }

  /**
   * Signs and sends one request using one credential snapshot.
   *
   * @typeParam TResponse - Parsed response payload type.
   * @param input - Request parameters and authentication material.
   * @returns The normalized HTTP response.
   */
  async request<TResponse>(
    input: RestGatewayRequestInput<TResponse>,
  ): Promise<MiaixzHttpResponse<TResponse>> {
    const parameters = prepareAdapterParameters(input.parameters);
    rejectAdapterReservedParameters(parameters);

    const timestamp = this.#now();
    if (!Number.isSafeInteger(timestamp) || timestamp < 0) {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        "The REST gateway clock returned an invalid timestamp.",
      );
    }

    const auth = normalizeAuth(typeof input.auth === "function" ? await input.auth() : input.auth);
    const signedParameters: RestGatewayParameters = {
      ...parameters,
      timestamp: String(timestamp),
    };
    const sign = await this.#signer.sign({
      httpMethod: input.httpMethod,
      parameters: signedParameters as RestSignInput["parameters"],
      auth,
    });
    const requestParameters: RestGatewayParameters = {
      ...signedParameters,
      sign,
    };
    const commonOptions = {
      headers: createAuthenticationHeaders(auth),
      authenticate: false,
      credentials: "omit" as const,
      retry: 0,
      envelope: "required" as const,
      ...(input.parse === undefined ? {} : { parse: input.parse }),
    };

    try {
      if (input.httpMethod === "GET") {
        return await this.#api.request<TResponse>(this.#path, {
          ...commonOptions,
          method: "GET",
          query: toQueryParameters(requestParameters),
        });
      }

      return await this.#api.request<TResponse, RestGatewayParameters>(this.#path, {
        ...commonOptions,
        method: "POST",
        body: requestParameters,
      });
    } catch (error) {
      if (error instanceof MiaixzApiError && (error.status === 401 || error.code === "100160")) {
        this.#onAuthenticationExpired?.();
      }
      throw error;
    }
  }
}

function signatureError(code: string, message: string): MiaixzSdkError {
  return new MiaixzSdkError(message, { code });
}

function normalizeHttpMethod(method: MiaixzHttpMethod): MiaixzHttpMethod {
  const normalized = typeof method === "string" ? method.toUpperCase() : "";
  if (!SUPPORTED_HTTP_METHODS.has(normalized as MiaixzHttpMethod)) {
    throw signatureError(
      "REST_SIGNATURE_PARAMETER_INVALID",
      "The REST gateway HTTP method is invalid.",
    );
  }
  return normalized as MiaixzHttpMethod;
}

function canonicalize(parameters: RestGatewayParameters): string {
  if (!isPlainObject(parameters)) {
    throw signatureError(
      "REST_SIGNATURE_PARAMETER_INVALID",
      "REST gateway parameters must be a plain object.",
    );
  }

  const descriptors = Object.getOwnPropertyDescriptors(parameters);
  const normalizedNames = new Set<string>();
  const normalized = new Map<string, string>();

  for (const name of Reflect.ownKeys(descriptors)) {
    if (typeof name !== "string") {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        "REST gateway parameters cannot use symbol keys.",
      );
    }
    const descriptor = descriptors[name];
    if (!descriptor || descriptor.get || descriptor.set || !("value" in descriptor)) {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        "REST gateway parameters cannot contain accessors.",
      );
    }

    const normalizedName = name.toLowerCase();
    if (normalizedNames.has(normalizedName)) {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        "REST gateway parameter names cannot differ only by letter case.",
      );
    }
    normalizedNames.add(normalizedName);

    if (normalizedName === "sign") {
      continue;
    }

    const value = normalizeParameterValue(descriptor.value, new WeakSet<object>());
    if (value !== undefined) {
      normalized.set(name, value);
    }
  }

  for (const name of REQUIRED_PARAMETERS) {
    const value = normalized.get(name);
    if (value === undefined || value.length === 0) {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        `The REST gateway parameter ${name} is required.`,
      );
    }
  }

  const timestamp = normalized.get("timestamp") ?? "";
  if (!/^(?:0|[1-9]\d{0,15})$/.test(timestamp) || !Number.isSafeInteger(Number(timestamp))) {
    throw signatureError(
      "REST_SIGNATURE_PARAMETER_INVALID",
      "The REST gateway timestamp is invalid.",
    );
  }

  return [...normalized.keys()]
    .sort()
    .map((name) => `${encodeRfc3986(name)}${encodeRfc3986(normalized.get(name) ?? "")}`)
    .join("");
}

function normalizeParameterValue(value: unknown, seen: WeakSet<object>): string | undefined {
  if (value === null || value === undefined) {
    throw signatureError(
      "REST_SIGNATURE_PARAMETER_INVALID",
      "REST gateway parameters cannot contain null or undefined values.",
    );
  }
  if (value === "") {
    return undefined;
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        "REST gateway numeric parameters must be finite.",
      );
    }
    return String(value);
  }
  if (Array.isArray(value) || isPlainObject(value)) {
    validateJsonValue(value, seen);
    return JSON.stringify(value);
  }
  throw signatureError(
    "REST_SIGNATURE_PARAMETER_INVALID",
    "The REST gateway contains an unsupported parameter value.",
  );
}

function validateJsonValue(value: unknown, seen: WeakSet<object>): void {
  if (value === null || value === undefined) {
    throw signatureError(
      "REST_SIGNATURE_PARAMETER_INVALID",
      "Complex REST gateway parameters cannot contain null values.",
    );
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        "Complex REST gateway numeric values must be finite.",
      );
    }
    return;
  }
  if (!Array.isArray(value) && !isPlainObject(value)) {
    throw signatureError(
      "REST_SIGNATURE_PARAMETER_INVALID",
      "Complex REST gateway parameters must be plain JSON values.",
    );
  }
  if (seen.has(value)) {
    throw signatureError(
      "REST_SIGNATURE_PARAMETER_INVALID",
      "Complex REST gateway parameters cannot contain cycles.",
    );
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.prototype.hasOwnProperty.call(value, index)) {
        throw signatureError(
          "REST_SIGNATURE_PARAMETER_INVALID",
          "Complex REST gateway arrays cannot contain holes.",
        );
      }
    }
  }

  seen.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const name of Reflect.ownKeys(descriptors)) {
    if (typeof name !== "string") {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        "Complex REST gateway parameters cannot use symbol keys.",
      );
    }
    const descriptor = descriptors[name];
    if (!descriptor || descriptor.get || descriptor.set || !("value" in descriptor)) {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        "Complex REST gateway parameters cannot contain accessors.",
      );
    }
    validateJsonValue(descriptor.value, seen);
  }
  seen.delete(value);
}

function encodeRfc3986(value: string): string {
  try {
    return encodeURIComponent(value).replace(
      /[!'()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  } catch {
    throw signatureError(
      "REST_SIGNATURE_PARAMETER_INVALID",
      "REST gateway parameters must contain valid Unicode text.",
    );
  }
}

async function deriveSigningKey(
  auth: RestSignatureAuth,
  parameters: RestGatewayParameters,
): Promise<Uint8Array> {
  const normalizedAuth = normalizeAuth(auth);
  const method = readRequiredStringParameter(parameters, "method");
  const timestamp = readRequiredStringParameter(parameters, "timestamp");
  if (normalizedAuth.mode === "legacy") {
    return encoder.encode(`${method}${timestamp}`);
  }

  const credential =
    normalizedAuth.mode === "v1-token" ? normalizedAuth.token : normalizedAuth.apiKey;
  const credentialMode = normalizedAuth.mode === "v1-token" ? "token" : "apikey";
  return sha256(encoder.encode(`v1\n${credentialMode}\n${credential}\n${method}\n${timestamp}\n`));
}

function normalizeAuth(auth: RestSignatureAuth): RestSignatureAuth {
  if (auth.mode === "legacy") {
    return auth;
  }
  if (auth.mode === "v1-token") {
    return { mode: "v1-token", token: normalizeCredential(auth.token, TOKEN_MAX_LENGTH, true) };
  }
  if (auth.mode === "v1-apikey") {
    return {
      mode: "v1-apikey",
      apiKey: normalizeCredential(auth.apiKey, API_KEY_MAX_LENGTH, false),
    };
  }
  throw signatureError(
    "REST_SIGNATURE_MODE_INVALID",
    "The REST gateway authentication mode is invalid.",
  );
}

function normalizeCredential(value: string, maximumLength: number, jwtLike: boolean): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (normalized.length === 0) {
    throw signatureError(
      "REST_SIGNATURE_CREDENTIAL_REQUIRED",
      "The REST gateway credential is required.",
    );
  }
  if (
    normalized.length > maximumLength ||
    !/^[\x21-\x7E]+$/.test(normalized) ||
    (jwtLike && !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(normalized))
  ) {
    throw signatureError(
      "REST_SIGNATURE_CREDENTIAL_INVALID",
      "The REST gateway credential is invalid.",
    );
  }
  return normalized;
}

function readRequiredStringParameter(parameters: RestGatewayParameters, name: string): string {
  const value = parameters[name];
  if (typeof value !== "string" || value.length === 0) {
    throw signatureError(
      "REST_SIGNATURE_PARAMETER_INVALID",
      `The REST gateway parameter ${name} is required.`,
    );
  }
  return value;
}

async function sha256(value: Uint8Array): Promise<Uint8Array> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw signatureError(
      "REST_SIGNATURE_CRYPTO_UNAVAILABLE",
      "Web Crypto is required to sign REST gateway requests.",
    );
  }
  return new Uint8Array(await subtle.digest("SHA-256", copyToArrayBuffer(value)));
}

async function hmacSha256(key: Uint8Array, value: Uint8Array): Promise<Uint8Array> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw signatureError(
      "REST_SIGNATURE_CRYPTO_UNAVAILABLE",
      "Web Crypto is required to sign REST gateway requests.",
    );
  }
  const cryptoKey = await subtle.importKey(
    "raw",
    copyToArrayBuffer(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await subtle.sign("HMAC", cryptoKey, copyToArrayBuffer(value)));
}

function copyToArrayBuffer(value: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy.buffer;
}

function encodeBase64(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let encoded = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const combined = (first << 16) | (second << 8) | third;
    encoded += alphabet[(combined >>> 18) & 63];
    encoded += alphabet[(combined >>> 12) & 63];
    encoded += index + 1 < bytes.length ? alphabet[(combined >>> 6) & 63] : "=";
    encoded += index + 2 < bytes.length ? alphabet[combined & 63] : "=";
  }
  return encoded;
}

function createAuthenticationHeaders(auth: RestSignatureAuth): Readonly<Record<string, string>> {
  if (auth.mode === "v1-token") {
    return { Authorization: `Bearer ${auth.token}` };
  }
  if (auth.mode === "v1-apikey") {
    return { "X-API-Key": auth.apiKey };
  }
  return {};
}

function rejectAdapterReservedParameters(parameters: RestGatewayParameters): void {
  for (const name of Object.keys(parameters)) {
    const normalized = name.toLowerCase();
    if (normalized === "timestamp" || normalized === "sign") {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        "timestamp and sign are generated by the REST gateway request adapter.",
      );
    }
  }
}

function prepareAdapterParameters(parameters: RestGatewayParameters): RestGatewayParameters {
  if (!isPlainObject(parameters)) {
    throw signatureError(
      "REST_SIGNATURE_PARAMETER_INVALID",
      "REST gateway parameters must be a plain object.",
    );
  }
  const clone: Record<string, RestJsonValue> = {};
  const descriptors = Object.getOwnPropertyDescriptors(parameters);
  const seen = new WeakMap<object, unknown>();
  for (const name of Reflect.ownKeys(descriptors)) {
    if (typeof name !== "string") {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        "REST gateway parameters cannot use symbol keys.",
      );
    }
    const descriptor = descriptors[name];
    if (!descriptor || descriptor.get || descriptor.set || !("value" in descriptor)) {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        "REST gateway parameters cannot contain accessors.",
      );
    }
    if (descriptor.value === null || descriptor.value === undefined) {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        "REST gateway parameters cannot contain null or undefined values.",
      );
    }
    if (descriptor.value !== "") {
      clone[name] = cloneJsonValue(descriptor.value, seen);
    }
  }
  return clone;
}

function cloneJsonValue(value: unknown, seen: WeakMap<object, unknown>): RestJsonValue {
  if (value === null || value === undefined) {
    throw signatureError(
      "REST_SIGNATURE_PARAMETER_INVALID",
      "REST gateway parameters cannot contain null or undefined values.",
    );
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        "REST gateway numeric parameters must be finite.",
      );
    }
    return value;
  }
  if (typeof value !== "object") {
    throw signatureError(
      "REST_SIGNATURE_PARAMETER_INVALID",
      "REST gateway parameters must be plain JSON values.",
    );
  }
  if (seen.has(value)) {
    throw signatureError(
      "REST_SIGNATURE_PARAMETER_INVALID",
      "REST gateway parameters cannot contain cycles.",
    );
  }
  if (Array.isArray(value)) {
    const clone: RestJsonValue[] = [];
    seen.set(value, clone);
    for (const item of value) {
      clone.push(cloneJsonValue(item, seen));
    }
    return clone;
  }
  if (!isPlainObject(value)) {
    throw signatureError(
      "REST_SIGNATURE_PARAMETER_INVALID",
      "REST gateway parameters must be plain JSON values.",
    );
  }
  const clone: Record<string, RestJsonValue> = {};
  seen.set(value, clone);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  for (const name of Reflect.ownKeys(descriptors)) {
    if (typeof name !== "string") {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        "REST gateway parameters cannot use symbol keys.",
      );
    }
    const descriptor = descriptors[name];
    if (!descriptor || descriptor.get || descriptor.set || !("value" in descriptor)) {
      throw signatureError(
        "REST_SIGNATURE_PARAMETER_INVALID",
        "REST gateway parameters cannot contain accessors.",
      );
    }
    clone[name] = cloneJsonValue(descriptor.value, seen);
  }
  return clone;
}

function toQueryParameters(
  parameters: RestGatewayParameters,
): Readonly<Record<string, string | number | boolean | null | undefined>> {
  const query: Record<string, string | number | boolean | null | undefined> = {};
  for (const [name, value] of Object.entries(parameters)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      query[name] = value;
    } else {
      query[name] = JSON.stringify(value);
    }
  }
  return query;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
