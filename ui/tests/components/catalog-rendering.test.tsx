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

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Badge,
  Bar,
  Brand,
  Breadcrumb,
  Checkbox,
  Cluster,
  Empty,
  Entry,
  Grid,
  Hidden,
  Notice,
  Page,
  Pagination,
  Progress,
  Radio,
  RadioGroup,
  Range,
  Sidebar,
  Skeleton,
  Split,
  Stack,
  Status,
  Switch,
  Textarea,
  Timeline,
  Toast,
  Toolbar,
} from "../../src/index.js";
import { renderWithLocale } from "../test-utils.js";

afterEach(cleanup);

describe("catalog presentation components", () => {
  it("renders status, loading, empty, and brand variants with canonical state", () => {
    const { container } = renderWithLocale(
      <Stack gap="medium">
        <Badge icon={<span>!</span>} marker tone="success" variant="outlined">
          Ready
        </Badge>
        <Status tone="danger">Failed</Status>
        <Notice live="assertive" tone="warning">
          Warning
        </Notice>
        <Bar active label="Loading" max={200} value={50} />
        <Bar active decorative />
        <Bar active label="Indeterminate" />
        <Bar active={false} />
        <Progress label="Uploading" max={200} showValue value={50} />
        <Progress label="Working" />
        <Skeleton height={20} variant="rounded" width="50%" />
        <Empty
          actions={<button type="button">Retry</button>}
          compact
          description="Nothing matched"
          icon={<span>?</span>}
          title="No results"
          variant="framed"
        />
        <Brand mark={<span>M</span>} name="Miaixz" />
      </Stack>,
    );
    expect(screen.getByText("Ready").closest(".miaixz-badge")).toHaveAttribute(
      "data-tone",
      "success",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Warning");
    expect(screen.getByRole("progressbar", { name: "Loading" })).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
    expect(screen.getByRole("progressbar", { name: "Uploading" })).toHaveTextContent("25%");
    expect(screen.getByRole("heading", { name: "No results" })).toBeVisible();
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it("renders layout primitives with their single semantic ownership", () => {
    const { container } = renderWithLocale(
      <Entry aside={<span>Welcome</span>} contentComponent="main" layout="split">
        <Page aria-labelledby="page-title" component="section" fullWidth>
          <h1 id="page-title">Account</h1>
          <Sidebar
            footer={<span>Footer</span>}
            sidebar={<nav aria-label="Local">Menu</nav>}
            sidebarLabel="Settings"
            size="wide"
            stickySidebar
          >
            <Grid minItemWidth="wide">
              <Cluster align="center">Cluster</Cluster>
              <Split align="center">Split</Split>
              <Hidden>Compact</Hidden>
            </Grid>
          </Sidebar>
        </Page>
      </Entry>,
    );
    expect(screen.getByRole("main")).toContainElement(
      screen.getByRole("heading", { name: "Account" }),
    );
    expect(screen.getByRole("complementary", { name: "Settings" })).toHaveAttribute(
      "data-sticky",
      "true",
    );
    expect(container.querySelector(".miaixz-grid-wide")).toBeTruthy();
    expect(screen.getByText("Compact")).toHaveClass("miaixz-hidden");
  });

  it("renders closed breadcrumb and timeline collections in source order", () => {
    renderWithLocale(
      <>
        <Breadcrumb
          items={[
            { id: "home", href: "/", label: "Home", icon: <span>H</span> },
            { id: "settings", current: true, label: "Settings" },
          ]}
          label="Path"
        />
        <Timeline
          aria-label="History"
          items={[
            {
              id: "created",
              title: "Created",
              description: "Initial record",
              meta: "09:00",
              status: "Done",
              tone: "success",
            },
            { id: "review", title: "Review", status: "Pending", tone: "warning" },
          ]}
          layout="rows"
          renderItem={(item, body) => <div data-custom={item.id}>{body}</div>}
        />
      </>,
    );
    const breadcrumb = screen.getByRole("navigation", { name: "Path" });
    expect(within(breadcrumb).getByRole("link", { name: /Home/u })).toHaveAttribute("href", "/");
    expect(within(breadcrumb).getByText("Settings").closest("[aria-current]")).toHaveAttribute(
      "aria-current",
      "page",
    );
    const timeline = screen.getByRole("list", { name: "History" });
    expect(within(timeline).getAllByRole("listitem")).toHaveLength(2);
    expect(timeline.parentElement?.querySelector("[data-custom='created']")).toBeTruthy();
  });
});

describe("catalog input components", () => {
  it("keeps Checkbox and Range native state, field attributes, refs, and slots on one owner", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const checkboxRef = vi.fn();
    const rangeRef = vi.fn();
    const { container } = renderWithLocale(
      <>
        <span id="choice-label">Choice</span>
        <span id="choice-help">Choice help</span>
        <Checkbox
          aria-describedby="choice-help"
          aria-invalid="true"
          aria-labelledby="choice-label"
          checked
          className="checkbox-custom"
          description="Description"
          disabled
          id="choice"
          indeterminate
          invalid
          label="Visible choice"
          name="choice"
          onChange={onChange}
          ref={checkboxRef}
          required
          slotProps={{
            root: ({ checked }) => ({ className: checked ? "checkbox-checked" : undefined }),
            input: { className: "checkbox-input" },
            mark: { className: "checkbox-mark" },
            content: { className: "checkbox-content" },
            label: { className: "checkbox-label" },
            description: { className: "checkbox-description" },
          }}
          style={{ color: "red" }}
        />
        <Checkbox aria-label="Bare checkbox" />
        <span id="range-label">Range</span>
        <span id="range-help">Range help</span>
        <Range
          aria-describedby="range-help"
          aria-invalid="true"
          aria-labelledby="range-label"
          disabled
          id="range"
          invalid
          max={10}
          min={0}
          ref={rangeRef}
          required
          slotProps={{
            root: ({ invalid }) => ({ className: invalid ? "range-invalid" : undefined }),
          }}
          value={5}
        />
        <Range aria-label="Bare range" />
      </>,
    );
    const checkbox = screen.getByRole("checkbox", { name: "Choice" });
    expect(checkbox).toBeDisabled();
    expect(checkbox).toBeRequired();
    expect(checkbox).toHaveAttribute("aria-checked", "mixed");
    expect(checkbox.closest("label")).toHaveClass("checkbox-custom", "checkbox-checked");
    expect(container.querySelector(".checkbox-description")).toHaveTextContent("Description");
    await user.click(checkbox);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("checkbox", { name: "Bare checkbox" })).not.toBeChecked();
    const range = screen.getByRole("slider", { name: "Range" });
    expect(range).toBeDisabled();
    expect(range).toHaveAttribute("required");
    expect(range).toHaveClass("range-invalid");
    expect(range).toHaveAttribute("data-invalid", "true");
    expect(screen.getByRole("slider", { name: "Bare range" })).not.toBeDisabled();
    expect(checkboxRef).toHaveBeenCalled();
    expect(rangeRef).toHaveBeenCalled();
  });

  it("uses native radio and switch controls with controlled and uncontrolled state", async () => {
    const user = userEvent.setup();
    const onGroupChange = vi.fn();
    const onRadioChange = vi.fn();
    const onSwitchChange = vi.fn();
    renderWithLocale(
      <>
        <Radio
          description="Primary choice"
          invalid
          label="Direct"
          name="direct"
          onChange={onRadioChange}
          value="direct"
        />
        <RadioGroup
          defaultValue="one"
          invalid
          items={[
            { id: "one", value: "one", label: "One", description: "First" },
            { id: "two", value: "two", label: "Two", disabled: true },
            { id: "three", value: "three", label: "Three" },
          ]}
          label="Options"
          name="options"
          onValueChange={onGroupChange}
          orientation="horizontal"
          required
        />
        <Switch
          defaultChecked
          description="Notifications"
          invalid
          label="Enabled"
          onChange={onSwitchChange}
          size="small"
        />
      </>,
    );
    await user.click(screen.getByRole("radio", { name: /Direct/u }));
    await user.click(screen.getByRole("radio", { name: "Three" }));
    await user.click(screen.getByRole("switch", { name: /Enabled/u }));
    expect(onRadioChange).toHaveBeenCalledOnce();
    expect(onGroupChange).toHaveBeenCalledWith("three", expect.anything());
    expect(onSwitchChange).toHaveBeenCalledOnce();
    expect(screen.getByRole("radio", { name: "Two" })).toBeDisabled();
  });

  it("tracks textarea filled state and forwards range validity", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithLocale(
      <>
        <Textarea
          aria-label="Notes"
          defaultValue="Initial"
          invalid
          resize="horizontal"
          size="large"
        />
        <Range aria-label="Volume" defaultValue={25} invalid max={100} min={0} />
      </>,
    );
    const textarea = screen.getByRole("textbox", { name: "Notes" });
    expect(textarea.parentElement).toHaveAttribute("data-filled", "true");
    await user.clear(textarea);
    expect(textarea.parentElement).not.toHaveAttribute("data-filled");
    fireEvent.change(screen.getByRole("slider", { name: "Volume" }), { target: { value: 50 } });
    rerender(<Textarea aria-label="Notes" disabled readOnly value="Controlled" />);
    expect(screen.getByRole("textbox", { name: "Notes" })).toBeDisabled();
  });
});

describe("catalog actions", () => {
  it("changes pagination through previous, numbered, and next buttons", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    renderWithLocale(
      <Pagination
        inset
        onPageChange={onPageChange}
        page={5}
        pageCount={10}
        showNext
        showPrevious
        siblingCount={1}
        summary="Page 5 of 10"
        nextLabel="Next page"
        previousLabel="Previous page"
        variant="plain"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Previous page" }));
    await user.click(screen.getByRole("button", { name: "第 6 页" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange.mock.calls.map(([page]) => page)).toEqual([4, 6, 6]);
    expect(screen.getAllByText("…")).toHaveLength(2);
  });

  it("manages semantic toolbar focus and toast actions", async () => {
    const user = userEvent.setup();
    const action = vi.fn();
    const close = vi.fn();
    renderWithLocale(
      <>
        <Toolbar aria-label="Formatting" behavior="toolbar" orientation="horizontal">
          <button type="button">Bold</button>
          <button disabled type="button">
            Italic
          </button>
          <button type="button">Link</button>
        </Toolbar>
        <Toast
          action={{ label: "Undo", onAction: action }}
          dismissLabel="Dismiss"
          id="toast-one"
          message="Saved successfully"
          onClose={close}
          title="Saved"
          tone="success"
        />
      </>,
    );
    const toolbar = screen.getByRole("toolbar", { name: "Formatting" });
    within(toolbar).getByRole("button", { name: "Bold" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(within(toolbar).getByRole("button", { name: "Link" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(within(toolbar).getByRole("button", { name: "Bold" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Undo" }));
    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(action).toHaveBeenCalledOnce();
    expect(close).toHaveBeenNthCalledWith(1, "toast-one", "action");
    expect(close).toHaveBeenNthCalledWith(2, "toast-one", "dismiss");
  });
});
