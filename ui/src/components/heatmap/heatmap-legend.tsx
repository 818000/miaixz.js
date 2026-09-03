import { classNames } from "../../internal/class-names.js";
import type { HeatmapLegendProps } from "./heatmap.types.js";

/**
 * Displays the same five activity colors as Heatmap without exposing color recipes.
 * @param props - Semantic tone, endpoint labels and standard span attributes.
 * @returns A noninteractive activity legend.
 * @public
 */
export function HeatmapLegend(props: HeatmapLegendProps) {
  const { tone, lowLabel, highLabel, className, ...attributes } = props;
  return (
    <span
      {...attributes}
      className={classNames("miaixz-heatmap-legend", `miaixz-heatmap-tone-${tone}`, className)}
    >
      {lowLabel}
      {[1, 2, 3, 4, 5].map((level) => (
        <i
          key={level}
          className="miaixz-heatmap-legend-cell"
          aria-hidden="true"
          data-level={level}
        />
      ))}
      {highLabel}
    </span>
  );
}
