import {
  miaixzThemeColorTokens,
  type MiaixzThemeColorOverrides,
  type MiaixzThemeColors,
  type MiaixzThemeColorToken,
  type MiaixzThemeOverrides,
} from "@miaixz/sdk/appearance";

/**
 * Re-exports the SDK-owned ordered color-token source.
 *
 * @public
 */
export { miaixzThemeColorTokens };

/**
 * Re-exports the SDK-owned color-token contract.
 *
 * @public
 */
export type {
  MiaixzThemeColorOverrides,
  MiaixzThemeColors,
  MiaixzThemeColorToken,
  MiaixzThemeOverrides,
};

/**
 * Maps every SDK color token to its public CSS custom property.
 *
 * @public
 */
export const miaixzThemeColorProperties = Object.freeze(
  Object.fromEntries(miaixzThemeColorTokens.map((token) => [token, `--miaixz-color-${token}`])),
) as Readonly<Record<MiaixzThemeColorToken, `--miaixz-color-${MiaixzThemeColorToken}`>>;
