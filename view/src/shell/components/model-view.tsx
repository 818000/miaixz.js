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

/**
 * Renders format-neutral document models without reparsing source bytes.
 */

import type { ViewerDocument } from "../../shared/contracts/document.js";

/**
 * Renders a framework model without reparsing source bytes.
 *
 * @param root0 - Model and zoom properties supplied by the viewer shell.
 * @param root0.document - Format-neutral document model to render.
 * @param root0.scale - Current visual scale applied by the shell.
 * @returns Rendered React element for the document model.
 */
export function ModelView({
  document,
  scale,
}: {
  readonly document: ViewerDocument;
  readonly scale: number;
}): React.ReactElement {
  const style = { transform: `scale(${scale})`, transformOrigin: "top center" };
  switch (document.kind) {
    case "media":
      if (document.mediaKind === "image") {
        return (
          <img
            alt={document.title}
            className="miaixz-preview-media"
            src={document.sourceUrl}
            style={style}
          />
        );
      }
      if (document.mediaKind === "audio") {
        return (
          <audio
            aria-label={document.title}
            className="miaixz-preview-audio"
            controls
            src={document.sourceUrl}
          />
        );
      }
      return (
        <video
          aria-label={document.title}
          className="miaixz-preview-video"
          controls
          src={document.sourceUrl}
        />
      );
    case "text":
      return (
        <pre className="miaixz-preview-text" style={style}>
          {document.content}
        </pre>
      );
    case "archive":
      return (
        <table className="miaixz-preview-table" style={style}>
          <thead>
            <tr>
              <th>Path</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            {document.entries.map((entry) => (
              <tr key={entry.path}>
                <td>{entry.path}</td>
                <td>{entry.directory ? "—" : entry.uncompressedSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    case "binary":
      return (
        <section className="miaixz-preview-binary" style={style}>
          <h2>{document.title}</h2>
          <dl>
            {document.summary.map((item) => (
              <div key={item.label}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    case "scene":
      return (
        <section className="miaixz-preview-scene" style={style}>
          <h2>{document.title}</h2>
          <p>
            {document.nodes.length} objects · {document.meshes.length} meshes
          </p>
          <ul>
            {document.nodes.map((node) => (
              <li key={node.id}>{node.name}</li>
            ))}
          </ul>
          {document.preview === undefined ? null : (
            <ModelView document={document.preview} scale={1} />
          )}
        </section>
      );
    case "flow":
      return (
        <article className="miaixz-preview-flow" style={style}>
          {document.sections.map((section) => (
            <section key={section.id}>
              {section.title === undefined ? null : <h2>{section.title}</h2>}
              <p>{section.text}</p>
            </section>
          ))}
        </article>
      );
    case "spreadsheet": {
      const sheet = document.sheets[0];
      return (
        <section className="miaixz-preview-sheet" style={style}>
          <h2>{sheet?.name ?? document.title}</h2>
          <table className="miaixz-preview-table">
            <tbody>
              {sheet?.cells.map((cell) => (
                <tr key={cell.address}>
                  <th>{cell.address}</th>
                  <td>{String(cell.value ?? "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      );
    }
    case "drawing":
      return (
        <svg
          aria-label={document.title}
          className="miaixz-preview-drawing"
          role="img"
          style={style}
          viewBox={`0 0 ${document.width} ${document.height}`}
        >
          {document.shapes.map((shape) =>
            shape.kind === "ellipse" ? (
              <ellipse
                cx={shape.x + shape.width / 2}
                cy={shape.y + shape.height / 2}
                fill={shape.fill ?? "none"}
                key={shape.id}
                rx={shape.width / 2}
                ry={shape.height / 2}
                stroke={shape.stroke ?? "currentColor"}
              />
            ) : shape.kind === "line" ? (
              <line
                key={shape.id}
                stroke={shape.stroke ?? "currentColor"}
                x1={shape.x}
                x2={shape.x + shape.width}
                y1={shape.y}
                y2={shape.y + shape.height}
              />
            ) : (
              <g key={shape.id}>
                <rect
                  fill={shape.fill ?? "none"}
                  height={shape.height}
                  stroke={shape.stroke ?? "currentColor"}
                  width={shape.width}
                  x={shape.x}
                  y={shape.y}
                />
                {shape.text === undefined ? null : (
                  <text x={shape.x + 4} y={shape.y + 16}>
                    {shape.text}
                  </text>
                )}
              </g>
            ),
          )}
        </svg>
      );
    case "paged":
      return (
        <section className="miaixz-preview-pages" style={style}>
          {document.pages.map((page) => (
            <article
              className="miaixz-preview-page"
              key={page.id}
              style={{ aspectRatio: `${page.width}/${page.height}` }}
            >
              {page.text}
            </article>
          ))}
        </section>
      );
  }
}
