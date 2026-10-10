/**
 * Implements the tree fixtures module.
 */

import type { TreeNode } from "../../src/components/tree/index.js";

export type TreeFixtureDepth = 2 | 3 | 6 | 10;

/**
 * Creates a single branch with stable IDs from tree-depth-01 through the requested depth.
 * @param depth - Number of linked levels to generate.
 * @returns One stable single-branch fixture at the requested depth.
 */
export function createTreeFixture(depth: TreeFixtureDepth): readonly TreeNode<string>[] {
  let child: TreeNode<string> | undefined;
  for (let level = depth; level >= 1; level -= 1) {
    const id = `tree-depth-${String(level).padStart(2, "0")}`;
    child = {
      id,
      label: level === depth ? `第 ${level} 层长名称节点 / Deep tree item` : `第 ${level} 层`,
      textValue: `Tree level ${level}`,
      description: level % 2 === 0 ? `第 ${level} 层说明` : undefined,
      trailing: `${level} / ${depth}`,
      value: id,
      ...(child === undefined ? {} : { children: [child] }),
    };
  }
  return child === undefined ? [] : [child];
}

/**
 * Twelve sibling records used to exercise wide-tree behavior.
 */
export const wideTreeFixture: readonly TreeNode<string>[] = Array.from(
  { length: 12 },
  (_, index) => ({
    id: `tree-wide-${String(index + 1).padStart(2, "0")}`,
    label: `宽树节点 ${index + 1}`,
    textValue: `Wide item ${index + 1}`,
    value: `wide-${index + 1}`,
    disabled: index === 5,
  }),
);

/**
 * One unresolved root used to exercise asynchronous loading.
 */
export const asyncTreeFixture: readonly TreeNode<string>[] = [
  {
    id: "tree-async-root",
    label: "异步目录",
    textValue: "Async root",
    value: "async-root",
    hasChildren: true,
  },
];

/**
 * Multiple roots used to exercise root sibling navigation and scopes.
 */
export const multiRootTreeFixture: readonly TreeNode<string>[] = [
  ...createTreeFixture(3),
  { id: "tree-root-b", label: "第二根节点", textValue: "Second root", value: "root-b" },
];
