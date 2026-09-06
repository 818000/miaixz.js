import { Header } from "../header/index.js";
import { Hidden } from "../hidden/index.js";
import { Tabs } from "../tabs/index.js";
import { Divider } from "../divider/index.js";
import type { ModuleFrameProps } from "./module-frame.types.js";

/**
 * Renders the shared title, navigation, and content frame used by product modules.
 *
 * @param props - Frame content and controlled navigation.
 * @returns The composed module frame.
 * @public
 */
export function ModuleFrame(props: ModuleFrameProps) {
  const {
    "aria-label": ariaLabel,
    title,
    description,
    actions,
    headingLevel = 1,
    navigation,
    disabled = false,
    children,
  } = props;
  return (
    <section
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className="miaixz-module-frame"
    >
      <div className="miaixz-module-frame-masthead">
        <Header
          variant="compact"
          spacing="none"
          title={title}
          description={description}
          actions={actions}
          headingLevel={headingLevel}
        />
        {navigation ? (
          <Tabs
            label={navigation.label}
            variant="navigation"
            panelPadding="none"
            value={navigation.value}
            onValueChange={navigation.onValueChange}
            items={navigation.items.map((item) => ({
              value: item.id,
              label: item.label,
              ...(disabled || item.disabled ? { disabled: true } : {}),
              content: <Hidden>{item.label}</Hidden>,
            }))}
          />
        ) : (
          <Divider />
        )}
      </div>
      <div className="miaixz-module-frame-content">{children}</div>
    </section>
  );
}
