/**
 * Configures locale-aware Miaixz formatters.
 *
 * @public
 */
export interface MiaixzFormatOptions {
  /**
   * Optional BCP 47 locale used by the platform formatter.
   */
  locale?: string;
}

/**
 * Formats a date with the platform Intl implementation.
 *
 * @param value - Date-compatible value to format.
 * @param options - Locale and date-time formatting options.
 * @returns An empty string for invalid dates.
 * @public
 */
export function formatMiaixzDate(
  value: Date | string | number,
  options: MiaixzFormatOptions & Intl.DateTimeFormatOptions = {},
): string {
  const { locale, ...formatOptions } = options;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, formatOptions).format(date);
}

/**
 * Formats a numeric value using locale-aware Intl options.
 *
 * @param value - Numeric value to format.
 * @param options - Locale and number formatting options.
 * @returns Locale-aware numeric text.
 * @public
 */
export function formatMiaixzNumber(
  value: number,
  options: MiaixzFormatOptions & Intl.NumberFormatOptions = {},
): string {
  const { locale, ...formatOptions } = options;
  return new Intl.NumberFormat(locale, formatOptions).format(value);
}

/**
 * Formats a byte count with a compact binary unit and localized number.
 *
 * @param bytes - Byte count to format.
 * @param options - Locale and fraction-digit options.
 * @returns Localized byte count or an empty string for non-finite input.
 * @public
 */
export function formatMiaixzBytes(
  bytes: number,
  options: MiaixzFormatOptions & {
    /**
     * Optional maximum number of fractional digits to display.
     */
    maximumFractionDigits?: number;
  } = {},
): string {
  if (!Number.isFinite(bytes)) return "";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"] as const;
  const absolute = Math.abs(bytes);
  const index =
    absolute === 0
      ? 0
      : Math.min(Math.floor(Math.log(absolute) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${formatMiaixzNumber(value, {
    ...(options.locale === undefined ? {} : { locale: options.locale }),
    maximumFractionDigits: options.maximumFractionDigits ?? 1,
  })} ${units[index]}`;
}
