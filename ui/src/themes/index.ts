import { miaixzThemeColorTokens } from "../tokens/colors.js";
import {
  miaixzDensities,
  miaixzThemeDensityGeometryFields,
  miaixzThemeLayoutGeometryFields,
} from "../tokens/geometry.js";
import { miaixzThemeRadiusFields } from "../tokens/radius.js";
import { miaixzThemeShadowLevels } from "../tokens/shadow.js";
import { miaixzThemeSurfaceFields, miaixzThemeSurfaceRoles } from "../tokens/surfaces.js";
import { contrastTheme } from "./contrast.js";
import { miaixzTheme } from "./miaixz.js";
import { neutralTheme } from "./neutral.js";

export { contrastTheme } from "./contrast.js";
export { miaixzTheme } from "./miaixz.js";
export { neutralTheme } from "./neutral.js";

/**
 * Lists built-in themes in their stable public catalog order.
 *
 * @public
 */
export const miaixzBuiltInThemes = Object.freeze([miaixzTheme, neutralTheme, contrastTheme]);

/**
 * Exposes the frozen field order consumed by the build-time CSS generator.
 */
export const miaixzThemeSerializationContract = Object.freeze({
  colors: miaixzThemeColorTokens,
  radius: miaixzThemeRadiusFields,
  shadowLevels: miaixzThemeShadowLevels,
  densities: miaixzDensities,
  densityGeometry: miaixzThemeDensityGeometryFields,
  layoutGeometry: miaixzThemeLayoutGeometryFields,
  surfaceRoles: miaixzThemeSurfaceRoles,
  surfaceFields: miaixzThemeSurfaceFields,
});
