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

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "@babel/parser";

const plan = readFileSync("docs/ui-component-adjustment-plan.md", "utf8");
const registrySource = readFileSync("ui/src/theme/components.ts", "utf8");
const failures = [];
const tableSection =
  plan.split("#### 3.7.1 Theme registry 最终 key 与批次")[1]?.split("### 3.8")[0] ?? "";
const assignments = new Map();

for (const match of tableSection.matchAll(/^\| (B[1-5]|C[1-8])\s+\|([^\n]+)$/gmu)) {
  const batch = match[1];
  for (const nameMatch of match[2].matchAll(/`([A-Z][A-Za-z0-9]+)`/gu)) {
    const name = nameMatch[1];
    if (assignments.has(name)) failures.push(`duplicate registry table key: ${name}`);
    assignments.set(name, batch);
  }
}

const ast = parse(registrySource, { sourceType: "module", plugins: ["typescript"] });
const declaration = ast.program.body.find(
  (node) =>
    node.type === "ExportNamedDeclaration" &&
    node.declaration?.type === "TSInterfaceDeclaration" &&
    node.declaration.id.name === "MiaixzThemeComponentRegistry",
)?.declaration;
if (declaration?.type !== "TSInterfaceDeclaration") {
  failures.push("MiaixzThemeComponentRegistry interface is missing");
}
const registryNames =
  declaration?.type === "TSInterfaceDeclaration"
    ? declaration.body.body.map((member) =>
        member.key.type === "Identifier" ? member.key.name : String(member.key.value),
      )
    : [];
for (const name of registryNames)
  if (!assignments.has(name)) failures.push(`registry key is absent from plan table: ${name}`);
for (const name of assignments.keys())
  if (!registryNames.includes(name)) failures.push(`plan key is absent from registry: ${name}`);

const stageSection =
  plan
    .split("### 阶段 B：完成 P0 纵向切片及其直接依赖")[1]
    ?.split("### 阶段 D：收口公共出口、样式和文档")[0] ?? "";
const batches = new Map();
for (const match of stageSection.matchAll(/^\d+\. \*\*(B[1-5]|C[1-8])[^\n]*\*\*：([^\n]*)$/gmu)) {
  batches.set(match[1], match[2]);
}
for (const [name, batch] of assignments) {
  const description = batches.get(batch) ?? "";
  if (!new RegExp(`(?:^|[^A-Za-z0-9])${name}(?:$|[^A-Za-z0-9])`, "u").test(description)) {
    failures.push(`${name} is not assigned in the ${batch} implementation paragraph`);
  }
}

const calls = new Map();
for (const file of walk("ui/src").filter((path) => path.endsWith(".tsx"))) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/withMiaixzThemeComponent\(\s*"([A-Z][A-Za-z0-9]+)"/gu)) {
    calls.set(match[1], (calls.get(match[1]) ?? 0) + 1);
  }
  for (const match of source.matchAll(
    /useMiaixzThemeComponent\("(Button|Input|Select|Dialog)"\)/gu,
  )) {
    calls.set(match[1], (calls.get(match[1]) ?? 0) + 1);
  }
}
for (const name of registryNames) {
  const count = calls.get(name) ?? 0;
  if (count !== 1) failures.push(`${name} must have exactly one Theme consumer; found ${count}`);
}
for (const name of calls.keys())
  if (!registryNames.includes(name)) failures.push(`unregistered Theme consumer: ${name}`);

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Adjustment plan and ${registryNames.length} Theme registry consumers are aligned.`);
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
