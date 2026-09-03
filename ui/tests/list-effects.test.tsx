import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { List } from "../src/components/list/index.js";

describe.each(["overview", "alert"] as const)(
  "%s list effects without row navigation",
  (variant) => {
    afterEach(cleanup);
    it("keeps only the supplied title interactive, not descriptions or outer icons", () => {
      const navigate = vi.fn();
      const { container } = render(
        <List
          variant={variant}
          items={[
            {
              tone: "brand",
              content: (
                <span>
                  <i>Icon</i>
                  <strong>
                    <a href="#title" onClick={navigate}>
                      Title
                    </a>
                    <em>Category</em>
                  </strong>
                  <small>Description</small>
                  <time>10:24</time>
                </span>
              ),
            },
          ]}
        />,
      );
      const row = screen.getByRole("listitem");
      expect(row.querySelectorAll("a")).toHaveLength(1);
      expect(row.hasAttribute("tabindex")).toBe(false);
      expect(container.querySelector(".miaixz-list-item-control")).toBeNull();
      for (const label of ["Icon", "Category", "Description", "10:24"]) {
        fireEvent.mouseEnter(screen.getByText(label));
        fireEvent.click(screen.getByText(label));
        expect(screen.getByText(label).closest("a, button")).toBeNull();
      }
      expect(navigate).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("link", { name: "Title" }));
      expect(navigate).toHaveBeenCalledOnce();
    });

    it("retains disabled static rows and existing full-row links", () => {
      const { container } = render(
        <List
          variant={variant}
          items={[
            { disabled: true, content: <span>Unavailable</span> },
            { href: "#existing", content: <span>Existing</span> },
          ]}
        />,
      );
      const rows = screen.getAllByRole("listitem");
      expect(rows[0]?.getAttribute("aria-disabled")).toBe("true");
      expect(rows[0]?.querySelector("a, button, [tabindex]")).toBeNull();
      expect(container.querySelectorAll(".miaixz-list-item-control")).toHaveLength(1);
      expect(screen.getByRole("link", { name: "Existing" }).getAttribute("href")).toBe("#existing");
    });

    it("shares the original effects and excludes disabled surfaces", () => {
      const css = readFileSync("src/styles/components/list.css", "utf8");
      expect(css).toContain(
        `.miaixz-list-${variant} .miaixz-list-item:not(.miaixz-list-item-interactive) > :only-child`,
      );
      expect(css).toContain(
        `.miaixz-list-${variant}\n  .miaixz-list-item:not(.miaixz-list-item-interactive, [aria-disabled="true"])\n  > :only-child:is(:hover, :has(:focus-visible))`,
      );
      expect(css).toContain(
        '.miaixz-list-item:not(.miaixz-list-item-interactive, [aria-disabled="true"])',
      );
      expect(css).toContain("> :only-child:is(:hover, :has(:focus-visible))");
      expect(css).toContain("background: var(--miaixz-color-surface-hover)");
      expect(css).toContain("box-shadow: inset 2px 0 0 var(--miaixz-list-tone)");
      expect(css).toContain("transform: translateX(3px)");
      expect(css).toContain(
        "transition-duration: var(--miaixz-list-composition-interaction-duration)",
      );
    });
  },
);
