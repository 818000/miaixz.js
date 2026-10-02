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
 * Verifies deterministic, zero-human design-brief review evidence.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "../..");
const moduleUrl = pathToFileURL(
  resolve(repositoryRoot, ".github/scripts/modules/icons/fonts/validate-icon-font.mjs"),
).href;
const { validateAutomatedBriefReviews } = (await import(moduleUrl)) as {
  validateAutomatedBriefReviews: (releasePlan: unknown, briefs: unknown) => void;
};
const releasePlan = JSON.parse(
  await readFile(resolve(process.cwd(), "src/assets/release-plan.json"), "utf8"),
) as Record<string, unknown>;
const reviewedBriefs = JSON.parse(
  await readFile(resolve(process.cwd(), "src/assets/design-briefs.json"), "utf8"),
) as {
  briefs: {
    name: string;
    intent: string;
    automatedReview: { sourceDigest: string; status: string };
    reviewers?: string[];
  }[];
};

describe("automated design-brief review gate", () => {
  it("accepts all 1024 deterministic review records", () => {
    expect(() => validateAutomatedBriefReviews(releasePlan, reviewedBriefs)).not.toThrow();
  });

  it("rejects stale evidence after authored content changes", () => {
    const invalid = structuredClone(reviewedBriefs);
    const first = invalid.briefs.at(0);
    if (first === undefined) throw new Error("Brief fixture is unexpectedly empty.");
    first.intent = `${first.intent} changed`;
    expect(() => validateAutomatedBriefReviews(releasePlan, invalid)).toThrow(
      /stale automated-review evidence/u,
    );
  });

  it("rejects a failed or forged review status", () => {
    const invalid = structuredClone(reviewedBriefs);
    const first = invalid.briefs.at(0);
    if (first === undefined) throw new Error("Brief fixture is unexpectedly empty.");
    first.automatedReview.status = "failed";
    expect(() => validateAutomatedBriefReviews(releasePlan, invalid)).toThrow(
      /stale automated-review evidence/u,
    );
  });

  it("rejects prohibited human-review fields", () => {
    const invalid = structuredClone(reviewedBriefs);
    const first = invalid.briefs.at(0);
    if (first === undefined) throw new Error("Brief fixture is unexpectedly empty.");
    first.reviewers = ["person"];
    expect(() => validateAutomatedBriefReviews(releasePlan, invalid)).toThrow(
      /prohibited human-review fields/u,
    );
  });
});
