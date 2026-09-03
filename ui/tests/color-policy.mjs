/** Fixed data-encoding recipes; this is not a file-wide bypass for new colors. */
const recipes = {
  "heatmap.css": [16, 32, 48, 64, 80].map(
    (level) =>
      `color-mix(in srgb, var(--miaixz-heatmap-tone) ${level}%, var(--miaixz-color-surface))`,
  ),
  "columns.css": [
    "color-mix(in srgb, var(--miaixz-columns-tone) 36%, var(--miaixz-surface-role-panel-background))",
    "color-mix(in srgb, var(--miaixz-columns-tone) 45%, var(--miaixz-color-surface))",
  ],
  "sparkline.css": ["color-mix(in srgb, var(--miaixz-sparkline-tone) 8%, transparent)"],
  "appearance.css": [
    "color-mix(in srgb, var(--miaixz-appearance-preview-brand) 18%, var(--miaixz-appearance-preview-surface))",
  ],
};

export function inspectComponentColors(fileName, source) {
  const clean = source.replace(/\/\*[\s\S]*?\*\//gu, "");
  const findings = [];
  const forcedRanges = Array.from(
    clean.matchAll(/@media\s*\(forced-colors:\s*active\)\s*\{/gu),
    (match) => {
      let depth = 1;
      let end = match.index + match[0].length;
      while (end < clean.length && depth > 0) {
        if (clean[end] === "{") depth++;
        if (clean[end] === "}") depth--;
        end++;
      }
      return [match.index, end];
    },
  );
  if (/#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\s*\(/iu.test(clean))
    findings.push("literal or relative color outside theme");
  // Paint values may contain tokens and CSS geometry, but not named color values.
  for (const match of clean.matchAll(
    /(?:^|[;{])\s*(?:color|background(?:-color|-image)?|border(?:-(?:top|right|bottom|left|block|inline|start|end|color))*(?:-color)?|outline(?:-color)?|fill|stroke|(?:box|text)-shadow|accent-color|caret-color)\s*:\s*([^;{}]+)/gu,
  )) {
    const value = match[1]
      .replace(/!important/giu, " ")
      .replace(/var\((?:[^()]|\([^()]*\))*\)/gu, " ")
      .replace(/-?(?:\d*\.)?\d+(?:[a-z%]+)?/giu, " ");
    const allowed = new Set([
      "transparent",
      "currentcolor",
      "inherit",
      "initial",
      "unset",
      "revert",
      "none",
      "solid",
      "dashed",
      "dotted",
      "double",
      "inset",
      "outset",
      "hidden",
      "groove",
      "ridge",
      "thin",
      "medium",
      "thick",
      "calc",
      "linear-gradient",
      "radial-gradient",
      "conic-gradient",
      "repeating-linear-gradient",
      "repeating-radial-gradient",
      "to",
      "top",
      "right",
      "bottom",
      "left",
      "center",
      "circle",
      "ellipse",
      "at",
      "color-mix",
      "in",
      "srgb",
    ]);
    if (forcedRanges.some(([start, end]) => match.index >= start && match.index < end)) {
      for (const systemColor of ["canvas", "canvastext", "highlight"]) allowed.add(systemColor);
    }
    const unknown =
      value
        .toLowerCase()
        .match(/[a-z][a-z-]*/gu)
        ?.filter((word) => !allowed.has(word)) ?? [];
    if (unknown.length) findings.push(`non-token paint outside theme: ${unknown.join(", ")}`);
  }
  for (const match of clean.matchAll(/\bcolor-mix\(/gu)) {
    let depth = 1;
    let end = match.index + match[0].length;
    while (end < clean.length && depth > 0) {
      if (clean[end] === "(") depth++;
      if (clean[end] === ")") depth--;
      end++;
    }
    const value = clean
      .slice(match.index, end)
      .replace(/\s+/gu, " ")
      .replace(/\(\s+/gu, "(")
      .replace(/\s+\)/gu, ")");
    if (!(recipes[fileName] ?? []).includes(value))
      findings.push(`unregistered color recipe: ${value}`);
  }
  if (/\b(?:saturate|brightness|hue-rotate|sepia|invert|light-dark)\(/u.test(clean))
    findings.push("color-changing filter or mode recipe");
  if (
    /(?:background(?:-color)?|border(?:-color)?)\s*:[^;{}]*var\(--miaixz-color-brand-strong\)/u.test(
      clean,
    )
  )
    findings.push("brand-strong is a foreground, not a surface");
  if (
    /(?:^|[;{])\s*color\s*:\s*var\(--miaixz-color-brand-(?:hover|active|soft(?:-hover)?)\)/u.test(
      clean,
    )
  )
    findings.push("brand state color used as text");
  return findings;
}
