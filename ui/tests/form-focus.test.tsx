import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";

import {
  Input,
  Search,
  Textarea,
  Select,
  Combobox,
  Picker,
  MiaixzLocaleProvider,
} from "../src/index.js";

type State = Pick<import("../src/index.js").InputProps, "disabled" | "readOnly" | "invalid">;
const options = [{ value: "string", label: "string" }];
const fields: Record<string, (state: State) => ReactNode> = {
  Input: (state) => <Input aria-label="文本" {...state} />,
  Search: (state) => <Search aria-label="搜索" {...state} />,
  Textarea: (state) => <Textarea aria-label="说明" {...state} />,
  Select: (state) => (
    <Select aria-label="选择" {...state}>
      <option>string</option>
    </Select>
  ),
  Combobox: (state) => <Combobox label="类型" options={options} {...state} />,
  Picker: (state) => <Picker label="多选" options={options} {...state} />,
};

afterEach(cleanup);

describe("shared field focus state ownership", () => {
  for (const [name, field] of Object.entries(fields)) {
    for (const state of ["normal", "disabled", "readonly", "invalid"] as const) {
      it(`${name} exposes ${state} on the shared focus shell`, () => {
        const props = {
          disabled: state === "disabled",
          readOnly: state === "readonly",
          invalid: state === "invalid",
        };
        const { container } = render(
          <MiaixzLocaleProvider i18n={createMiaixzI18n()}>{field(props)}</MiaixzLocaleProvider>,
        );
        const shell = container.querySelector<HTMLElement>(".miaixz-control")!;
        expect(shell).not.toBeNull();
        for (const key of ["disabled", "readonly", "invalid"]) {
          expect(shell.getAttribute(`data-${key}`)).toBe(state === key ? "true" : null);
        }
        const editor = shell.matches("textarea") ? shell : shell.querySelector("input, button")!;
        expect(editor).not.toBeNull();
        if (state === "disabled") expect(editor.hasAttribute("disabled")).toBe(true);
      });
    }
  }
});
