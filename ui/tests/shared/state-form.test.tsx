import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import { createRef, type InputHTMLAttributes } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Field, useFieldControl } from "../../src/components/field/index.js";
import {
  registerMiaixzFormValidationControl,
  resolveMiaixzFormOwner,
} from "../../src/shared/form-validation-registry.js";
import { useControlValueState } from "../../src/shared/use-control-value-state.js";
import { useControlled } from "../../src/shared/use-controlled.js";
import { useStableId } from "../../src/shared/use-stable-id.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/**
 * Renders a custom native control using the public Field protocol.
 *
 * @param props - Native input and Field state properties.
 * @returns A Field-aware native input.
 */
function CustomInput(
  props: InputHTMLAttributes<HTMLInputElement> & {
    /**
     * Applies custom invalid styling.
     */
    invalid?: boolean;
  },
) {
  const fieldProps = useFieldControl(props);
  const { invalid: _invalid, ...inputProps } = fieldProps;
  return <input {...inputProps} />;
}

describe("shared controlled state", () => {
  it("uses one transition function for controlled and uncontrolled values", () => {
    const onValueChange = vi.fn();
    const uncontrolled = renderHook(() =>
      useControlled({ value: undefined, defaultValue: "first", onValueChange }),
    );
    act(() => uncontrolled.result.current.setValue("second"));
    expect(uncontrolled.result.current.value).toBe("second");
    expect(onValueChange).toHaveBeenCalledWith("second");

    const controlled = renderHook(() =>
      useControlled({ value: "fixed", defaultValue: "", onValueChange }),
    );
    act(() => controlled.result.current.setValue("requested"));
    expect(controlled.result.current.value).toBe("fixed");
    expect(onValueChange).toHaveBeenLastCalledWith("requested");
  });

  it("rejects ambiguous and interactive read-only controlled configurations", () => {
    expect(() =>
      renderHook(() =>
        useControlled({
          value: "controlled",
          defaultValue: "default",
          hasDefaultValue: true,
          onValueChange: vi.fn(),
        }),
      ),
    ).toThrow(expect.objectContaining({ code: "UI_CONTROLLED_VALUE_INVALID" }));
    expect(() =>
      renderHook(() => useControlled({ value: "controlled", defaultValue: "default" })),
    ).toThrow(expect.objectContaining({ code: "UI_CONTROLLED_VALUE_INVALID" }));
  });

  it("reports a controlled mode change only once", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const hook = renderHook(
      ({
        value,
      }: {
        /**
         * Supplies the current controlled value.
         */
        value: string | undefined;
      }) => useControlled({ value, defaultValue: "default", onValueChange: vi.fn() }),
      { initialProps: { value: undefined } },
    );
    hook.rerender({ value: "controlled" });
    hook.rerender({ value: undefined });
    expect(warning).toHaveBeenCalledTimes(1);
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("UI_CONTROLLED_MODE_CHANGED"));
  });
});

describe("stable identifiers and native-derived state", () => {
  it("retains explicit ids and produces stable generated ids", () => {
    const explicit = renderHook(() => useStableId("control-id", "prefix"));
    expect(explicit.result.current).toBe("control-id");
    const generated = renderHook(() => useStableId(undefined, "prefix"));
    const first = generated.result.current;
    generated.rerender();
    expect(generated.result.current).toBe(first);
    expect(first).toMatch(/^prefix-/u);
  });

  it("re-reads the native control after a form reset", async () => {
    const controlRef = createRef<HTMLInputElement>();
    /**
     * Mirrors a checkbox's native state for the reset assertion.
     *
     * @returns The reset test fixture.
     */
    function ResetFixture() {
      const state = useControlValueState({
        controlRef,
        value: undefined,
        defaultValue: false,
        read: (control: HTMLInputElement) => control.checked,
      });
      return (
        <form>
          <input ref={controlRef} type="checkbox" defaultChecked onChange={state.sync} />
          <output>{String(state.value)}</output>
        </form>
      );
    }
    render(<ResetFixture />);
    const input = screen.getByRole("checkbox");
    input.click();
    expect(screen.getByText("false")).toBeInTheDocument();
    act(() => input.form?.reset());
    await act(() => Promise.resolve());
    expect(screen.getByText("true")).toBeInTheDocument();
  });
});

describe("Field registration protocol", () => {
  it("connects a wrapped custom control without cloning it", () => {
    render(
      <Field
        controlId="account"
        errorText="Required"
        helperText="Public name"
        label="Account"
        required
      >
        <span>
          <CustomInput aria-describedby="external external" />
        </span>
      </Field>,
    );
    const control = screen.getByRole("textbox", { name: "Account" });
    expect(control).toHaveAttribute("id", "account");
    expect(control).toBeRequired();
    expect(control).toBeInvalid();
    expect(control).toHaveAttribute(
      "aria-describedby",
      "external account-description account-error",
    );
  });

  it("rejects conflicting control state and multiple main controls", () => {
    expect(() =>
      render(
        <Field label="Account" required>
          <CustomInput required={false} />
        </Field>,
      ),
    ).toThrow(expect.objectContaining({ code: "UI_FIELD_REQUIRED_CONFLICT" }));
    expect(() =>
      render(
        <Field label="Account">
          <CustomInput />
          <CustomInput />
        </Field>,
      ),
    ).toThrow(expect.objectContaining({ code: "UI_FIELD_MULTIPLE_CONTROLS" }));
  });
});

describe("non-native form validation registry", () => {
  it("validates in DOM order, prevents once, and focuses only the first invalid control", () => {
    const form = document.createElement("form");
    const first = document.createElement("button");
    const second = document.createElement("button");
    form.append(first, second);
    document.body.append(form);
    const firstFocus = vi.fn();
    const secondFocus = vi.fn();
    const order: string[] = [];
    const unregisterSecond = registerMiaixzFormValidationControl(form, {
      element: second,
      validate: () => {
        order.push("second");
        return false;
      },
      reset: vi.fn(),
      focus: secondFocus,
    });
    const unregisterFirst = registerMiaixzFormValidationControl(form, {
      element: first,
      validate: () => {
        order.push("first");
        return false;
      },
      reset: vi.fn(),
      focus: firstFocus,
    });
    const submit = new Event("submit", { bubbles: true, cancelable: true });
    form.dispatchEvent(submit);
    expect(order).toEqual(["first", "second"]);
    expect(submit.defaultPrevented).toBe(true);
    expect(firstFocus).toHaveBeenCalledTimes(1);
    expect(secondFocus).not.toHaveBeenCalled();
    expect(resolveMiaixzFormOwner(first, undefined)).toBe(form);
    unregisterFirst();
    unregisterSecond();
    form.remove();
  });
});
