import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/components/metric.css", "utf8");

describe("summary metric reference motion", () => {
  it("paints the sweep with the existing theme tone, never a new color", () => {
    const sweep = css.match(/\.miaixz-metric-summary::after \{([^}]+)\}/)![1]!;
    expect(sweep).toContain(
      "background: linear-gradient(90deg, transparent, var(--miaixz-metric-tone), transparent);",
    );
    expect(sweep).toContain("pointer-events: none;");
    expect(sweep).toContain("opacity: 0;");
    const frames = css.split("@keyframes miaixz-metric-sweep {")[1]!.split("@keyframes")[0]!;
    expect(frames).toMatch(/16%\s*\{\s*opacity: 0\.08;/);
    expect(frames).toMatch(/82%\s*\{\s*opacity: 0\.064;/);
    expect(sweep).not.toMatch(/color-mix|#[\da-f]{3,8}\b/i);
  });

  it("restores entry after the ready rule, before pointer and focus replay", () => {
    const reducedMotionGate = css.indexOf("@media (prefers-reduced-motion: no-preference)");
    const ready = css.indexOf("animation-name: none;", reducedMotionGate);
    const entry = css.indexOf('.miaixz-metric-summary[data-motion-state="enter"]', ready);
    const replay = css.indexOf('.miaixz-metric-summary[data-motion-replay="true"]', entry);
    expect(ready).toBeGreaterThan(reducedMotionGate);
    expect(entry).toBeGreaterThan(ready);
    expect(replay).toBeGreaterThan(entry);
    expect(css.slice(entry, replay)).toContain(
      "animation: miaixz-sparkline-draw 2s cubic-bezier(0.2, 0.7, 0.2, 1) 180ms both;",
    );
  });

  it("preserves the reference hover timing and stroke fade-in", () => {
    expect(css).toContain("miaixz-metric-sweep 1.8s cubic-bezier(0.22, 0.7, 0.2, 1) 80ms both");
    expect(css).toContain(
      "miaixz-metric-sparkline-replay 1.65s cubic-bezier(0.2, 0.72, 0.2, 1) 80ms both",
    );
    expect(css).toContain(
      "miaixz-metric-value-focus 720ms cubic-bezier(0.16, 0.82, 0.25, 1.15) 180ms both",
    );
    expect(css).toContain("miaixz-metric-arrow 1.15s ease-in-out 180ms infinite");
    const frames = css
      .split("@keyframes miaixz-metric-sparkline-replay {")[1]!
      .split("@keyframes")[0]!;
    expect(frames).toMatch(/0%\s*\{\s*opacity: 0\.28;/);
    expect(frames).toMatch(/30%\s*\{\s*opacity: 1;/);
  });
});
