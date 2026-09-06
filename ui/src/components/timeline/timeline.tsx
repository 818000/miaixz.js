import type { TimelineProps } from "./timeline.types.js";

/**
 * Renders ordered events with readable status text and a continuous visual track.
 *
 * @param props - Ordered timeline content.
 * @returns The semantic ordered timeline.
 * @public
 */
export function Timeline(props: TimelineProps) {
  const { "aria-label": ariaLabel, items } = props;
  return (
    <ol aria-label={ariaLabel} className="miaixz-timeline">
      {items.map((item) => (
        <li key={item.id} className="miaixz-timeline-item" data-tone={item.tone}>
          <span className="miaixz-timeline-node" aria-hidden="true" />
          <div className="miaixz-timeline-body">
            <div className="miaixz-timeline-heading">
              <strong className="miaixz-timeline-title">{item.title}</strong>
              <span className="miaixz-timeline-status">{item.status}</span>
            </div>
            {item.description !== undefined && (
              <div className="miaixz-timeline-description">{item.description}</div>
            )}
            {item.meta !== undefined && <div className="miaixz-timeline-meta">{item.meta}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
