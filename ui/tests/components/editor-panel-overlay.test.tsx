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
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  EditorActions,
  EditorBox,
  EditorFields,
  EditorFieldset,
  EditorGroup,
  EditorLayout,
  EditorOverview,
  EditorPicker,
  EditorSection,
  EditorStatus,
  EditorSummary,
} from "../../src/components/editor/index.js";
import { Overlay } from "../../src/components/overlay/index.js";
import { Panel, PanelFooter, PanelHeader, PanelRow } from "../../src/components/panel/index.js";

afterEach(cleanup);

describe("Editor compositions", () => {
  it("renders every closed composition with deterministic variants and slots", () => {
    const { container } = render(
      <EditorFieldset legend="Profile" emphasis="strong" className="fieldset-custom">
        <EditorLayout
          summary="Summary area"
          layout="single"
          divided
          slotProps={{
            summary: ({ divided }) => ({ className: divided ? "summary-divided" : undefined }),
            content: { className: "layout-content" },
          }}
        >
          <EditorSummary
            avatar="Avatar"
            title="Account"
            subtitle="Primary"
            status="Verified"
            footer="Last changed today"
            headingLevel={1}
            items={[{ id: "email", label: "Email", value: "owner@example.test" }]}
            slotProps={{
              avatar: { className: "avatar-slot" },
              title: ({ headingLevel }) => ({ className: `title-${headingLevel}` }),
              subtitle: { className: "subtitle-slot" },
              status: { className: "status-slot" },
              facts: { className: "facts-slot" },
              footer: { className: "footer-slot" },
            }}
          />
          <EditorSection
            title="Preferences"
            description="Choose defaults"
            accessory={<button type="button">Help</button>}
            headingLevel={5}
            surface="card"
            layout="two-column"
            slotProps={{
              header: { className: "section-header" },
              description: { className: "section-description" },
              body: { className: "section-body" },
            }}
          >
            <EditorGroup
              title="Notifications"
              description="Delivery methods"
              accessory="Required"
              slotProps={{
                header: { className: "group-header" },
                description: { className: "group-description" },
                options: { className: "group-options" },
              }}
            >
              <EditorFields columns={2}>Fields</EditorFields>
            </EditorGroup>
          </EditorSection>
          <EditorGroup title="Standalone" headingLevel={2}>
            Explicit group
          </EditorGroup>
          <EditorOverview
            density="comfortable"
            items={[
              { id: "used", label: "Used", value: "8 GB", description: "of 10 GB" },
              { id: "free", label: "Free", value: "2 GB" },
            ]}
            slotProps={{
              item: ({ itemId }) => ({ className: `item-${itemId}` }),
              label: { className: "overview-label" },
              value: { className: "overview-value" },
              description: { className: "overview-description" },
            }}
          />
          <EditorBox className="box-custom">Box</EditorBox>
          <EditorPicker aria-label="Available choices">Picker</EditorPicker>
          <span id="picker-name">Selected choices</span>
          <EditorPicker aria-labelledby="picker-name">Labelled picker</EditorPicker>
          <EditorActions className="actions-custom">Actions</EditorActions>
          <EditorStatus tone="brand" label="Ready" className="status-custom">
            Details
          </EditorStatus>
        </EditorLayout>
      </EditorFieldset>,
    );

    expect(container.querySelector("fieldset")).toHaveAttribute("data-emphasis", "strong");
    expect(container.querySelector(".miaixz-editor-layout")).toHaveAttribute(
      "data-divided",
      "true",
    );
    expect(container.querySelector(".summary-divided")).toHaveTextContent("Summary area");
    expect(screen.getByRole("heading", { name: "Account", level: 1 })).toHaveClass("title-1");
    expect(screen.getByText("Verified")).toHaveClass("status-slot");
    expect(screen.getByText("Last changed today")).toHaveClass("footer-slot");
    expect(screen.getByRole("heading", { name: "Notifications", level: 6 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Standalone", level: 2 })).toBeInTheDocument();
    expect(container.querySelector(".item-used")).toHaveTextContent("of 10 GB");
    expect(container.querySelector(".item-free .overview-description")).toBeNull();
    expect(container.querySelector('[aria-label="Available choices"]')).toHaveTextContent("Picker");
    expect(container.querySelector('[aria-labelledby="picker-name"]')).toHaveTextContent(
      "Labelled picker",
    );
  });

  it("uses the compact default branches when optional editor content is absent", () => {
    const { container } = render(
      <EditorLayout summary="Summary">
        <EditorSummary avatar="A" title="T" subtitle="S" items={[]} />
        <EditorSection title="Section">
          <EditorGroup title="Group">Content</EditorGroup>
        </EditorSection>
        <EditorOverview items={[]} />
      </EditorLayout>,
    );
    expect(container.querySelector(".miaixz-editor-layout")).not.toHaveAttribute("data-divided");
    expect(container.querySelector(".miaixz-editor-summary-status")).toBeNull();
    expect(container.querySelector(".miaixz-editor-summary-footer")).toBeNull();
    expect(container.querySelector(".miaixz-editor-section-description")).toBeNull();
    expect(screen.getByRole("heading", { name: "Group", level: 3 })).toBeInTheDocument();
  });
});

describe("Panel", () => {
  it("forwards one semantic name and composes header, actions, body, and footer slots", () => {
    const { container } = render(
      <Panel
        as="section"
        aria-label="Account panel"
        title="Account"
        description="Manage account"
        leading="Avatar"
        actions="Edit"
        headingLevel={4}
        footer="Saved"
        surface="plain"
        frame="elevated"
        density="comfortable"
        slotProps={{
          root: ({ as }) => ({ className: `root-${as}` }),
          header: { className: "header-slot" },
          body: { className: "body-slot" },
          footer: ({ density }) => ({ className: `footer-${density}` }),
          actions: { className: "actions-slot" },
        }}
      >
        Body
      </Panel>,
    );
    const panel = screen.getByRole("region", { name: "Account panel" });
    expect(panel).toHaveClass("root-section");
    expect(panel).toHaveAttribute("data-surface", "plain");
    expect(panel).toHaveAttribute("data-frame", "elevated");
    expect(screen.getByRole("heading", { name: "Account", level: 4 })).toBeInTheDocument();
    expect(container.querySelector(".header-slot")).toHaveTextContent("Manage account");
    expect(container.querySelector(".actions-slot")).toHaveTextContent("Edit");
    expect(container.querySelector(".body-slot")).toHaveTextContent("Body");
    expect(container.querySelector(".footer-comfortable")).toHaveTextContent("Saved");
  });

  it("supports standalone header/footer/row defaults and explicit variants", () => {
    const { container } = render(
      <>
        <PanelHeader title="Default header" />
        <PanelHeader
          title="Explicit header"
          description="Description"
          leading="Leading"
          actions="Actions"
          headingLevel={1}
          density="compact"
          divider
          alignment="start"
          slotProps={{
            root: { className: "explicit-header" },
            copy: { className: "copy-slot" },
            leading: { className: "leading-slot" },
            title: { className: "title-slot" },
            description: { className: "description-slot" },
            actions: { className: "header-actions-slot" },
          }}
        />
        <PanelFooter>Default footer</PanelFooter>
        <PanelFooter density="comfortable" divider={false} alignment="between">
          Explicit footer
        </PanelFooter>
        <PanelRow>Default row</PanelRow>
        <PanelRow distribution="start" slotProps={{ root: { className: "row-slot" } }}>
          Explicit row
        </PanelRow>
      </>,
    );
    expect(container.querySelector(".explicit-header")).toHaveAttribute("data-divider", "true");
    expect(screen.getByRole("heading", { name: "Explicit header", level: 1 })).toHaveClass(
      "title-slot",
    );
    expect(screen.getByText("Default footer")).toHaveAttribute("data-alignment", "end");
    expect(screen.getByText("Explicit footer")).not.toHaveAttribute("data-divider");
    expect(screen.getByText("Default row")).toHaveAttribute("data-distribution", "between");
    expect(screen.getByText("Explicit row")).toHaveClass("row-slot");
  });

  it("rejects missing, duplicate, and blank semantic names", () => {
    const invalid = (props: Record<string, unknown>) =>
      render(<Panel {...(props as never)}>Body</Panel>);
    expect(() => invalid({ as: "section" })).toThrowError(
      expect.objectContaining({ code: "UI_PANEL_LABEL_INVALID" }),
    );
    expect(() => invalid({ as: "aside", "aria-label": "A", "aria-labelledby": "b" })).toThrowError(
      expect.objectContaining({ code: "UI_PANEL_LABEL_INVALID" }),
    );
    expect(() => invalid({ as: "section", "aria-label": " " })).toThrowError(
      expect.objectContaining({ code: "UI_PANEL_LABEL_INVALID" }),
    );
    expect(() => invalid({ as: "aside", "aria-labelledby": " " })).toThrowError(
      expect.objectContaining({ code: "UI_PANEL_LABEL_INVALID" }),
    );
  });
});

describe("Overlay", () => {
  it("moves focus for a blocking load and restores it after completion", () => {
    const slotProps = {
      root: { className: "overlay-root" },
      content: { className: "overlay-content" },
      surface: { className: "overlay-surface" },
      indicator: { className: "overlay-indicator" },
    } as const;
    const { container, rerender } = render(
      <Overlay active={false} label="Loading" slotProps={slotProps} data-testid="overlay">
        <button type="button">Save</button>
      </Overlay>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    button.focus();
    rerender(
      <Overlay active label="Loading" slotProps={slotProps} data-testid="overlay">
        <button type="button">Save</button>
      </Overlay>,
    );
    const surface = container.querySelector<HTMLElement>(".overlay-surface")!;
    expect(surface).toHaveFocus();
    expect(screen.getByTestId("overlay")).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector(".overlay-content")).toHaveAttribute("inert");
    expect(container.querySelector(".overlay-indicator")).toHaveTextContent("Loading");

    rerender(
      <Overlay active={false} label="Loading" slotProps={slotProps} data-testid="overlay">
        <button type="button">Save</button>
      </Overlay>,
    );
    expect(button).toHaveFocus();
    expect(screen.getByTestId("overlay")).not.toHaveAttribute("aria-busy");
    expect(container.querySelector(".overlay-surface")).toBeNull();
  });

  it("keeps content interactive for a nonblocking load", () => {
    const { container } = render(
      <Overlay active blocking={false} label="Refreshing">
        <button type="button">Continue</button>
      </Overlay>,
    );
    const button = screen.getByRole("button", { name: "Continue" });
    button.focus();
    expect(button).toHaveFocus();
    expect(container.querySelector(".miaixz-overlay-content")).not.toHaveAttribute("inert");
    expect(container.querySelector(".miaixz-overlay-surface")).not.toHaveFocus();
  });

  it("does not restore a target that becomes disabled", () => {
    const { rerender } = render(
      <Overlay active={false} label="Loading">
        <button type="button">Submit</button>
      </Overlay>,
    );
    screen.getByRole("button", { name: "Submit" }).focus();
    rerender(
      <Overlay active label="Loading">
        <button type="button">Submit</button>
      </Overlay>,
    );
    rerender(
      <Overlay active={false} label="Loading">
        <button type="button" disabled>
          Submit
        </button>
      </Overlay>,
    );
    expect(screen.getByRole("button", { name: "Submit" })).not.toHaveFocus();
  });
});
