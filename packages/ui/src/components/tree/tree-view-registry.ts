/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~ http://www.apache.org/licenses/LICENSE-2.0                                ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS.         ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

/**
 * Implements the tree view registry module.
 */

import { MiaixzUiError } from "../../errors/ui-error.js";
import { assertTreeViewModel } from "./tree-view-invariants.js";
import type { TreeViewModel, TreeViewStrategyInput } from "./tree-view.types.js";
import type { TreeView } from "./tree.types.js";
import { compactTreeStrategy } from "./views/compact-tree-strategy.js";
import { focusTreeStrategy } from "./views/focus-tree-strategy.js";
import { nestedTreeStrategy } from "./views/nested-tree-strategy.js";

const treeViewStrategies = {
  nested: nestedTreeStrategy,
  compact: compactTreeStrategy,
  focus: focusTreeStrategy,
} as const;

/**
 * Creates a view model through the closed built-in strategy registry.
 * @param view - Registered built-in view name.
 * @param input - Collection, expansion state, focus root, and view options.
 * @returns A validated renderer-facing tree view model.
 */
export function createTreeViewModel<Value>(
  view: TreeView,
  input: TreeViewStrategyInput<Value>,
): TreeViewModel<Value> {
  const strategy = treeViewStrategies[view];
  if (strategy === undefined) {
    throw new MiaixzUiError({ code: "UI_TREE_CONFIG_INVALID", details: { view } });
  }
  const model = strategy.createViewModel(input);
  if (process.env.NODE_ENV !== "production") assertTreeViewModel(model);
  return model;
}
