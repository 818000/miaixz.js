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

/**
 * Verifies the frozen catalog, release plan, and pre-drawing design briefs.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const assetsRoot = resolve(process.cwd(), "src/assets");

/**
 * Reads one source-data JSON file.
 *
 * @param name - Asset filename.
 * @returns Parsed JSON data.
 */
async function readAsset(name: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(resolve(assetsRoot, name), "utf8")) as Record<string, unknown>;
}

describe("frozen icon source data", () => {
  it("contains one complete non-empty brief for every canonical name", async () => {
    const plan = await readAsset("release-plan.json");
    const briefFile = await readAsset("design-briefs.json");
    const schema = await readAsset("design-briefs.schema.json");
    const canonicalNames = plan.canonicalNames as string[];
    const briefs = briefFile.briefs as Record<string, unknown>[];
    const itemSchema = (
      (schema.properties as Record<string, unknown>).briefs as {
        items: { required: string[] };
      }
    ).items;

    expect(briefs).toHaveLength(1024);
    expect(briefs.map(({ name }) => name)).toEqual(canonicalNames);
    expect(new Set(briefs.map(({ name }) => name)).size).toBe(1024);
    for (const brief of briefs) {
      expect(Object.keys(brief)).toEqual(expect.arrayContaining(itemSchema.required));
      for (const key of [
        "intent",
        "metaphor",
        "primaryObject",
        "compactAdjustments",
        "standardConstruction",
        "displayAdjustments",
        "outlineStrategy",
        "filledStrategy",
        "topologyPlan",
      ]) {
        expect(String(brief[key]).trim().length).toBeGreaterThan(0);
      }
      expect(brief.forbiddenMeanings).toEqual([expect.any(String)]);
      expect(brief.secondaryObjects).toEqual(expect.arrayContaining([expect.any(String)]));
      expect(brief.degenerates).toEqual(expect.any(Object));
      expect(brief.automatedReview).toEqual({
        engine: "miaixz-icons-brief-validator",
        rulesetVersion: 1,
        sourceDigest: expect.stringMatching(/^[0-9a-f]{64}$/u),
        status: "passed",
      });
      expect(brief).not.toHaveProperty("reviewers");
      expect(brief).not.toHaveProperty("approvalCommit");
    }
  });

  it("commits draft 2020-12 schemas for every source-data document", async () => {
    for (const filename of [
      "catalog.schema.json",
      "design-briefs.schema.json",
      "release-plan.schema.json",
    ]) {
      const schema = await readAsset(filename);
      expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
      expect(schema.type).toBe("object");
      expect(schema.additionalProperties).toBe(false);
    }
  });
});
