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

import { forwardRef, useId, useLayoutEffect, useRef, type Ref } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { classNames } from "../../shared/class-names.js";
import { MiaixzButtonContent } from "./button-content.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useMiaixzThemeComponent } from "../../theme/context.js";
import { getMiaixzThemeSlotClassNames } from "../../theme/components.js";
import type {
  ButtonLinkProps,
  ButtonLinkRenderProps,
  ButtonLinkRootAttributes,
  ButtonOwnerState,
  ButtonProps,
  ButtonRootAttributes,
  ButtonSlot,
  ButtonSlotProps,
} from "./button.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders the default final native anchor.
 *
 * @param props - Final native anchor properties.
 * @param ref - Merged anchor reference.
 * @returns Native anchor element.
 */
function renderNativeAnchor(
  props: ButtonLinkRenderProps,
  ref: Ref<HTMLAnchorElement>,
): React.ReactElement {
  return <a {...props} ref={ref} />;
}

/**
 * Removes component-only Button props from a native root property set.
 *
 * @param props - Button properties that may contain component-only fields.
 * @returns Native button root properties.
 */
function getButtonNativeProps(props: Partial<ButtonProps>): Partial<ButtonRootAttributes> {
  const {
    children: _children,
    variant: _variant,
    tone: _tone,
    size: _size,
    block: _block,
    loading: _loading,
    loadingLabel: _loadingLabel,
    startIcon: _startIcon,
    endIcon: _endIcon,
    slotProps: _slotProps,
    ...nativeProps
  } = props;
  return nativeProps;
}

/**
 * Renders a semantic command Button.
 *
 * @public
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const { t } = useMiaixzLocale();
  const labelId = useId();
  const theme = useMiaixzThemeComponent("Button");
  const themeDefaults = theme?.defaultProps;
  const variant = props.variant ?? themeDefaults?.variant ?? "outlined";
  const tone = props.tone ?? themeDefaults?.tone ?? "neutral";
  const size = props.size ?? themeDefaults?.size ?? "medium";
  const block = props.block ?? themeDefaults?.block ?? false;
  const loading = props.loading ?? themeDefaults?.loading ?? false;
  const disabled = (props.disabled ?? themeDefaults?.disabled) === true || loading;
  const type = props.type ?? themeDefaults?.type ?? "button";
  const ownerState: ButtonOwnerState = { variant, tone, size, block, loading, disabled };
  const slotThemeClasses = (slot: ButtonSlot) =>
    getMiaixzThemeSlotClassNames(theme, ownerState, slot);
  const rootProps = mergeMiaixzSlotProps<ButtonOwnerState, ButtonRootAttributes, HTMLButtonElement>(
    {
      ownerState,
      defaultProps: {
        className: classNames(
          "miaixz-interactive",
          "miaixz-control",
          "miaixz-button",
          `miaixz-control-${size}`,
        ),
      },
      themeDefaultProps: getButtonNativeProps(themeDefaults ?? {}),
      componentProps: getButtonNativeProps(props),
      themeClassNames: slotThemeClasses("root"),
      slotProps: props.slotProps?.root,
      forwardedRef: ref,
      internalProps: {
        type,
        disabled,
        ...(loading ? { "aria-busy": true, "data-loading": true } : {}),
        "aria-labelledby": labelId,
        "data-miaixz-ripple": "true",
        "data-variant": variant,
        "data-tone": tone,
        "data-size": size,
        ...(block ? { "data-block": "true" } : {}),
      },
      ownedProps: [
        "type",
        "disabled",
        "aria-busy",
        "aria-labelledby",
        "data-loading",
        "data-miaixz-ripple",
        "data-variant",
        "data-tone",
        "data-size",
        "data-block",
      ],
    },
  );
  const slotProps = props.slotProps;
  return (
    <button {...rootProps}>
      <MiaixzButtonContent
        ownerState={ownerState}
        labelId={labelId}
        startIcon={props.startIcon ?? themeDefaults?.startIcon}
        endIcon={props.endIcon ?? themeDefaults?.endIcon}
        loadingLabel={props.loadingLabel ?? themeDefaults?.loadingLabel ?? t("ui.loading")}
        slotProps={slotProps}
        themeClassNames={{
          label: slotThemeClasses("label"),
          startIcon: slotThemeClasses("startIcon"),
          endIcon: slotThemeClasses("endIcon"),
          loadingIndicator: slotThemeClasses("loadingIndicator"),
        }}
      >
        {props.children}
      </MiaixzButtonContent>
    </button>
  );
});

/**
 * Renders a Button-presented final native navigation anchor.
 *
 * @public
 */
export const ButtonLink = withMiaixzThemeComponent(
  "ButtonLink",
  forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(props, forwardedRef) {
    const {
      href,
      children,
      variant = "outlined",
      tone = "neutral",
      size = "medium",
      block = false,
      startIcon,
      endIcon,
      renderAnchor = renderNativeAnchor,
      slotProps,
      ...nativeProps
    } = props;
    const ownerState: ButtonOwnerState = {
      variant,
      tone,
      size,
      block,
      loading: false,
      disabled: false,
    };
    const anchorRef = useRef<HTMLAnchorElement>(null);
    useLayoutEffect(() => {
      if (anchorRef.current instanceof HTMLAnchorElement) return;
      throw new MiaixzUiError({
        code: "UI_BUTTON_LINK_RENDERER_INVALID",
      });
    }, []);
    const rootProps = mergeMiaixzSlotProps<
      ButtonOwnerState,
      ButtonLinkRootAttributes,
      HTMLAnchorElement
    >({
      ownerState,
      defaultProps: {
        className: classNames(
          "miaixz-interactive",
          "miaixz-control",
          "miaixz-button",
          `miaixz-control-${size}`,
        ),
      },
      componentProps: nativeProps,
      slotProps: slotProps?.root,
      internalRef: anchorRef,
      forwardedRef,
      internalProps: {
        href,
        "data-miaixz-ripple": "true",
        "data-variant": variant,
        "data-tone": tone,
        "data-size": size,
        ...(block ? { "data-block": "true" } : {}),
      },
      ownedProps: [
        "href",
        "data-miaixz-ripple",
        "data-variant",
        "data-tone",
        "data-size",
        "data-block",
      ],
    });
    return renderAnchor(
      {
        ...rootProps,
        href,
        children: (
          <MiaixzButtonContent
            ownerState={ownerState}
            startIcon={startIcon}
            endIcon={endIcon}
            slotProps={slotProps}
          >
            {children}
          </MiaixzButtonContent>
        ),
      },
      rootProps.ref as Ref<HTMLAnchorElement>,
    );
  }),
);
