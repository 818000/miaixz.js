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

import { describe, expect, it } from "vitest";

import {
  isMiaixzHostVersionCompatible,
  parseMiaixzModuleManifest,
} from "../../src/contracts/module-manifest.js";
import { compareMiaixzModuleNavigation } from "../../src/contracts/navigation.js";
import { isMiaixzModulePermission } from "../../src/contracts/permission.js";
import {
  isMiaixzModuleIdentifier,
  isMiaixzModulePath,
  isMiaixzModulePermissionList,
} from "../../src/contracts/route.js";

const validManifest = {
  protocolVersion: "1.0.0",
  id: "module-one",
  version: "1.2.3",
  hostVersion: "^1.2.0",
  kind: "integrated",
  basePath: "/module-one",
  entry: "@project/module-one",
  routes: [
    {
      id: "route-one",
      path: "/overview",
      titleKey: "module-one.route.overview",
      requiredPermissions: ["module:document:read"],
    },
    { id: "route-two", path: "/settings", titleKey: "module-one.route.settings" },
  ],
  navigation: [
    { id: "nav-two", routeId: "route-two", labelKey: "module-one.nav.two", order: 2 },
    { id: "nav-one", routeId: "route-one", labelKey: "module-one.nav.one", icon: "Home", order: 1 },
  ],
  requiredPermissions: ["module:document:read"],
  requiredCapabilities: ["context", "events", "i18n", "navigation", "permissions"],
} as const;

describe("module manifest contract", () => {
  it("validates protocol atoms and semantic host compatibility", () => {
    for (const id of ["module-one", "a1"]) expect(isMiaixzModuleIdentifier(id)).toBe(true);
    for (const id of ["A", "a", "module_one", 1]) expect(isMiaixzModuleIdentifier(id)).toBe(false);
    for (const path of ["/", "/settings", "/nested/path"])
      expect(isMiaixzModulePath(path)).toBe(true);
    for (const path of ["", "relative", "//host", "/end/", "/a:b", "/a?b", "/a#b", 1]) {
      expect(isMiaixzModulePath(path)).toBe(false);
    }
    expect(isMiaixzModulePermission("module:document:read")).toBe(true);
    expect(isMiaixzModulePermission("module:*:read")).toBe(false);
    expect(isMiaixzModulePermissionList([])).toBe(true);
    expect(isMiaixzModulePermissionList(["module:document:read"])).toBe(true);
    expect(isMiaixzModulePermissionList(["bad"])).toBe(false);
    expect(isMiaixzModulePermissionList("bad")).toBe(false);

    for (const [host, range, expected] of [
      ["1.2.0", "^1.2.0", true],
      ["1.3.0", "^1.2.0", true],
      ["1.2.0-alpha.2", "^1.2.0", false],
      ["1.2.0", "^1.2.1", false],
      ["2.0.0", "^1.2.0", false],
      ["1.2.0-alpha.2", "^1.1.0", true],
      ["1.2.0-alpha.2", "bad", false],
      ["bad", "^1.2.0", false],
    ] as const) {
      expect(isMiaixzHostVersionCompatible(host, range)).toBe(expected);
    }
    expect(
      compareMiaixzModuleNavigation(validManifest.navigation[0], validManifest.navigation[1]),
    ).toBeGreaterThan(0);
    expect(
      compareMiaixzModuleNavigation(
        { ...validManifest.navigation[0], order: 1 },
        validManifest.navigation[1],
      ),
    ).toBeGreaterThan(0);
  });

  it("returns a sorted deeply frozen manifest and accepts secure iframe entries", () => {
    const result = parseMiaixzModuleManifest(validManifest, { hostVersion: "1.3.0" });
    expect(result.navigation.map((item) => item.id)).toEqual(["nav-one", "nav-two"]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.routes)).toBe(true);
    expect(Object.isFrozen(result.routes[0]?.requiredPermissions)).toBe(true);
    expect(Object.isFrozen(result.navigation[0])).toBe(true);
    expect(
      parseMiaixzModuleManifest(
        { ...validManifest, kind: "iframe", entry: "https://modules.example/module.js" },
        { environment: "production" },
      ).kind,
    ).toBe("iframe");
    expect(
      parseMiaixzModuleManifest(
        { ...validManifest, kind: "iframe", entry: "http://localhost/module.js" },
        { environment: "test" },
      ).entry,
    ).toBe("http://localhost/module.js");
  });

  it("rejects every malformed manifest field without partial normalization", () => {
    const invalidValues: unknown[] = [
      null,
      { ...validManifest, unknown: true },
      { ...validManifest, protocolVersion: "2.0.0" },
      { ...validManifest, id: "Bad" },
      { ...validManifest, version: "01.0.0" },
      { ...validManifest, hostVersion: "1.0.0" },
      { ...validManifest, kind: "worker" },
      { ...validManifest, basePath: "relative" },
      { ...validManifest, entry: " entry " },
      { ...validManifest, routes: null },
      { ...validManifest, navigation: null },
      { ...validManifest, requiredPermissions: ["bad"] },
      { ...validManifest, requiredCapabilities: ["unknown"] },
      { ...validManifest, routes: [null] },
      { ...validManifest, routes: [{ ...validManifest.routes[0], extra: true }] },
      { ...validManifest, routes: [{ ...validManifest.routes[0], id: "Bad" }] },
      { ...validManifest, routes: [{ ...validManifest.routes[0], path: "/module-one/inside" }] },
      { ...validManifest, routes: [{ ...validManifest.routes[0], titleKey: "" }] },
      { ...validManifest, routes: [{ ...validManifest.routes[0], requiredPermissions: ["bad"] }] },
      { ...validManifest, navigation: [null] },
      { ...validManifest, navigation: [{ ...validManifest.navigation[0], routeId: "Bad" }] },
      { ...validManifest, navigation: [{ ...validManifest.navigation[0], labelKey: "" }] },
      { ...validManifest, navigation: [{ ...validManifest.navigation[0], icon: 1 }] },
      { ...validManifest, navigation: [{ ...validManifest.navigation[0], order: Number.NaN }] },
      { ...validManifest, routes: [validManifest.routes[0], validManifest.routes[0]] },
      { ...validManifest, navigation: [validManifest.navigation[0], validManifest.navigation[0]] },
      {
        ...validManifest,
        navigation: [{ ...validManifest.navigation[0], routeId: "missing-route" }],
      },
      { ...validManifest, kind: "iframe", entry: "http://modules.example/module.js" },
      { ...validManifest, kind: "iframe", entry: "not a url" },
    ];
    for (const value of invalidValues) {
      expect(() => parseMiaixzModuleManifest(value)).toThrowError(
        expect.objectContaining({ code: "MODULE_MANIFEST_INVALID" }),
      );
    }
    expect(() =>
      parseMiaixzModuleManifest(validManifest, { environment: "unknown" as "production" }),
    ).toThrowError(expect.objectContaining({ code: "MODULE_MANIFEST_INVALID" }));
    expect(() => parseMiaixzModuleManifest(validManifest, { hostVersion: "2.0.0" })).toThrowError(
      expect.objectContaining({ code: "MODULE_HOST_INCOMPATIBLE" }),
    );
  });
});
