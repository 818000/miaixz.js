import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { PageProps } from "./page.types.js";

/**
 * Establishes the width, spacing, and semantic main region of a page. @public
 */
export const Page = forwardRef<HTMLElement, PageProps>(function Page(
  { fullWidth = false, className, ...props },
  ref,
) {
  return (
    <section
      {...props}
      ref={ref}
      className={classNames("miaixz-page", fullWidth && "miaixz-page-fullwidth", className)}
    />
  );
});
