import { forwardRef, useState } from "react";

import { classNames } from "../../internal/class-names.js";
import type { AvatarProps } from "./avatar.types.js";

/**
 * Derives the first two visible Unicode graphemes from a display name.
 *
 * @param name - Display name used to generate the fallback.
 * @returns Uppercase graphemes or a question mark when the name is empty.
 */
function createAvatarFallback(name: string): string {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const fallback = Array.from(segmenter.segment(name.trim()), ({ segment }) => segment)
    .filter((segment) => segment.trim().length > 0)
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase();

  return fallback || "?";
}

/**
 * Renders an accessible avatar image with a Unicode-safe name fallback.
 *
 * @public
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(
  { src, alt, name, size = "medium", className, ...props },
  ref,
) {
  const [failedSource, setFailedSource] = useState<string>();
  const displaysImage = src !== undefined && src.length > 0 && failedSource !== src;

  return (
    <span
      {...props}
      ref={ref}
      data-size={size}
      data-state={displaysImage ? "image" : "fallback"}
      className={classNames("miaixz-avatar", `miaixz-avatar-${size}`, className)}
    >
      {displaysImage ? (
        <img
          className="miaixz-avatar-image"
          src={src}
          alt={alt}
          onError={() => setFailedSource(src)}
        />
      ) : (
        <span className="miaixz-avatar-fallback" role="img" aria-label={alt}>
          {createAvatarFallback(name)}
        </span>
      )}
    </span>
  );
});
