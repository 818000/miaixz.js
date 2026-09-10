import assert from "node:assert/strict";
import test from "node:test";

import { createApiClient, RestGatewayClient, RestSigner } from "../dist/api/index.js";

const timestamp = "1735689600000";

test("legacy login signature matches the fixed protocol vector", async () => {
  const signer = new RestSigner();
  const signature = await signer.sign({
    httpMethod: "POST",
    parameters: {
      method: "dp.auth.login",
      v: "1.0",
      format: "json",
      timestamp,
      email: " User+测试@example.com ",
      password: "0123456789abcdef",
    },
    auth: { mode: "legacy" },
  });

  assert.equal(signature, "fLZWPF1zStL5rMEeSvxMQjm9CjS56bcCglVsbTwkytc=");
});

test("V1 token signature matches the fixed protocol vector", async () => {
  const signer = new RestSigner();
  const signature = await signer.sign({
    httpMethod: "GET",
    parameters: {
      method: "dp.user.get",
      v: "1.0",
      format: "json",
      timestamp,
      "a!": "x y",
      nested: { z: "值", a: true },
    },
    auth: {
      mode: "v1-token",
      token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature",
    },
  });

  assert.equal(signature, "FJKVvM+JVB0AMrnL07bdQYw4AHwHC92dpZY5ZFD9efo=");
});

test("V1 token and API key signatures match the published protocol vectors", async () => {
  const signer = new RestSigner();
  const parameters = {
    method: "test.sign.v1",
    timestamp: "1786464000123",
    format: "json",
    v: "1.0",
  };

  await assert.doesNotReject(async () => {
    assert.equal(
      await signer.sign({
        httpMethod: "GET",
        parameters,
        auth: {
          mode: "v1-token",
          token: "eyJhbGciOiJub25lIn0.eyJzdWIiOiJ0ZXN0In0.c2ln",
        },
      }),
      "zFZwPVeS9odIa2F7u0QOKSIKPeupjKnRPOSjr0IjW3g=",
    );
    assert.equal(
      await signer.sign({
        httpMethod: "GET",
        parameters,
        auth: { mode: "v1-apikey", apiKey: "test-api-key-2026" },
      }),
      "tTu9C8xHZOp1vk/ktXldbQdz3Fkrx2axORJ2n36LjPo=",
    );
  });
});

test("sign is excluded case-insensitively and parameter input is not mutated", async () => {
  const parameters = Object.freeze({
    method: "dp.auth.login",
    v: "1.0",
    format: "json",
    timestamp,
    Sign: "ignored",
  });
  const signer = new RestSigner();

  const withSign = await signer.sign({ httpMethod: "POST", parameters, auth: { mode: "legacy" } });
  const withoutSign = await signer.sign({
    httpMethod: "POST",
    parameters: { method: "dp.auth.login", v: "1.0", format: "json", timestamp },
    auth: { mode: "legacy" },
  });

  assert.equal(withSign, withoutSign);
  assert.equal(parameters.Sign, "ignored");
});

test("invalid credentials and unsupported values fail with stable error codes", async () => {
  const signer = new RestSigner();
  const base = { method: "dp.user.get", v: "1.0", format: "json", timestamp };

  await assert.rejects(
    signer.sign({
      httpMethod: "GET",
      parameters: base,
      auth: { mode: "v1-token", token: "not-a-jwt" },
    }),
    { code: "REST_SIGNATURE_CREDENTIAL_INVALID" },
  );
  await assert.rejects(
    signer.sign({
      httpMethod: "GET",
      parameters: { ...base, invalid: Number.NaN },
      auth: { mode: "legacy" },
    }),
    { code: "REST_SIGNATURE_PARAMETER_INVALID" },
  );
  await assert.rejects(
    signer.sign({
      httpMethod: "GET",
      parameters: { ...base, invalid: null },
      auth: { mode: "legacy" },
    }),
    { code: "REST_SIGNATURE_PARAMETER_INVALID" },
  );
  await assert.rejects(
    signer.sign({
      httpMethod: "GET",
      parameters: base,
      auth: { mode: "v1-token", token: "" },
    }),
    { code: "REST_SIGNATURE_CREDENTIAL_REQUIRED" },
  );
});

test("gateway adapter signs one snapshot and omits browser credentials", async () => {
  let captured;
  const api = createApiClient({
    baseUrl: "https://dev.example.com/router/rest",
    fetch: async (input, init) => {
      captured = { input: String(input), init };
      return new Response(JSON.stringify({ errcode: 0, errmsg: "ok", data: { accepted: true } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  const gateway = new RestGatewayClient({ api, now: () => Number(timestamp) });
  const response = await gateway.request({
    httpMethod: "POST",
    parameters: { method: "dp.auth.login", v: "1.0", format: "json" },
    auth: { mode: "legacy" },
    parse: (value) => value,
  });

  assert.deepEqual(response.data, { accepted: true });
  assert.equal(captured.input, "https://dev.example.com/router/rest");
  assert.equal(captured.init.credentials, "omit");
  assert.equal(captured.init.headers.get("authorization"), null);
  const body = JSON.parse(captured.init.body);
  assert.equal(body.timestamp, timestamp);
  assert.equal(typeof body.sign, "string");
  assert.equal(body.method, "dp.auth.login");
});

test("gateway adapter reports the HTTP and business session-expiration signals", async () => {
  let calls = 0;
  const expired = [];
  const api = createApiClient({
    baseUrl: "https://dev.example.com/router/rest",
    fetch: async () => {
      calls += 1;
      if (calls === 1) {
        return Response.json({ errcode: 100160, errmsg: "expired" });
      }
      return Response.json({ errcode: 100160, errmsg: "unauthorized" }, { status: 401 });
    },
  });
  const gateway = new RestGatewayClient({
    api,
    now: () => Number(timestamp),
    onAuthenticationExpired: () => expired.push(true),
  });
  const request = {
    httpMethod: "GET",
    parameters: { method: "dp.user.get", v: "1.0", format: "json" },
    auth: {
      mode: "v1-token",
      token: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature",
    },
  };

  await assert.rejects(gateway.request(request), { code: "100160" });
  await assert.rejects(gateway.request(request), { status: 401 });
  assert.equal(expired.length, 2);
});

test("gateway adapter preserves a data-less legacy business error", async () => {
  const api = createApiClient({
    baseUrl: "https://dev.example.com/router/rest",
    fetch: async () => Response.json({ errcode: "100100", errmsg: "Invalid username or password" }),
  });
  const gateway = new RestGatewayClient({ api, now: () => Number(timestamp) });

  await assert.rejects(
    gateway.request({
      httpMethod: "POST",
      parameters: { method: "dp.auth.login", v: "1.0", format: "json" },
      auth: { mode: "legacy" },
    }),
    { status: 200, code: "100100" },
  );
});

test("gateway adapter sends V1 API keys through X-API-Key", async () => {
  let headers;
  const api = createApiClient({
    baseUrl: "https://dev.example.com/router/rest",
    fetch: async (_input, init) => {
      headers = new Headers(init?.headers);
      return Response.json({ errcode: 0, errmsg: "ok", data: true });
    },
  });
  const gateway = new RestGatewayClient({ api, now: () => Number(timestamp) });

  await gateway.request({
    httpMethod: "GET",
    parameters: { method: "test.sign.v1", v: "1.0", format: "json" },
    auth: { mode: "v1-apikey", apiKey: "test-api-key-2026" },
  });

  assert.equal(headers.get("x-api-key"), "test-api-key-2026");
  assert.equal(headers.has("authorization"), false);
});
