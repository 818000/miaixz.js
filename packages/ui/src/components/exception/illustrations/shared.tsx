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
 * Provides original, neutral office-scene primitives with theme-owned fills.
 */

import type { ReactNode } from "react";

/**
 * Frames a decorative, non-interactive story with no external resources or embedded text.
 *
 * @param props - Decorative scene properties.
 * @returns Local inline artwork.
 */
export function Scene(props: { readonly children: ReactNode; readonly name: string }) {
  const { children, name } = props;
  return (
    <svg
      className="miaixz-exception-scene"
      viewBox="0 0 600 360"
      aria-hidden="true"
      focusable="false"
      data-scene={name}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/**
 * Draws an office colleague searching an open folder, in ordinary unmarked clothes.
 *
 * @returns Local inline artwork.
 */
export function SearchingColleague() {
  return (
    <g>
      <path
        className="miaixz-exception-neutral"
        d="M110 206 138 205 141 247 134 303 121 303 119 251 106 274 91 303 78 300 96 255Z"
      />
      <path
        className="miaixz-exception-paper"
        d="m78 298 13 3-1 9H68q-4-4 10-12Zm44 2 13 1 9 6v5h-24Z"
      />
      <path
        className="miaixz-exception-clothing"
        d="m108 149 20 4 20 19-12 27-6 19-29-5-17-13 10-31Z"
      />
      <path className="miaixz-exception-skin" d="m119 145 2 11 9 4 5-16 10-8 1-18-14-5-14 9Z" />
      <path
        className="miaixz-exception-neutral"
        d="M119 144q-14-2-9-19 2-15 17-17 17-2 23 8l-4 9-12-7-5 17-7-3Z"
      />
      <path className="miaixz-exception-skin" d="m98 180 7 7-6 15 22 8 17-2 4 7-20 5-35-13Z" />
      <path className="miaixz-exception-skin" d="m137 174 6-12-5-8 5-7 8 8-1 13-7 15Z" />
      <path className="miaixz-exception-paper" d="m126 194 27-8 24 8-14 32-33-9-17-17Z" />
      <path d="m153 186-4 30m-38-58-4 20m20 37-5-4" />
    </g>
  );
}

/**
 * Draws a colleague reaching toward a visible document, with no symbolic gesture.
 *
 * @returns Local inline artwork.
 */
export function ReachingColleague() {
  return (
    <g>
      <path
        className="miaixz-exception-neutral"
        d="m354 256 29-2 29 24-5 13-34-12-22 24-18-3 8-24Z"
      />
      <path
        className="miaixz-exception-paper"
        d="m332 296 18 3-3 11h-24q-3-6 9-14Zm54-13 20 7 11 8-2 6-30-8Z"
      />
      <path
        className="miaixz-exception-clothing"
        d="m356 196 19-3 18 16 34-42 10 8-35 56-17 7-1 28-40-4-8-17 7-28Z"
      />
      <path className="miaixz-exception-skin" d="m427 167 10 8 9-16 5-14-4-3-8 14-8 3Z" />
      <path className="miaixz-exception-skin" d="m359 184 2 14 14 4 7-13 10-9-4-16-19-2Z" />
      <path
        className="miaixz-exception-neutral"
        d="M359 189q-15-9-9-24 7-17 24-11l14 11-10 5-3 14-8 9Z"
      />
      <path className="miaixz-exception-neutral" d="M351 178q-15-2-18 9-2 14 11 15 12 2 15-12Z" />
      <path className="miaixz-exception-skin" d="m347 224-12 24 8 6 15-16 6-11-5-6Z" />
      <path d="m375 202-10 20m24 13-9 9" />
    </g>
  );
}

/**
 * Provides an unlabelled shelf and a loose page as a concrete destination for the search.
 *
 * @returns Local inline artwork.
 */
export function OfficeShelf() {
  return (
    <g>
      <path className="miaixz-exception-paper" d="M448 112h92v192h-6V118h-80v186h-6Z" />
      <path d="M454 171h80m-80 65h80m-80 58h80" />
      <rect className="miaixz-exception-paper" x="465" y="146" width="48" height="25" rx="2" />
      <path d="M465 152h48m-29 9h10" />
      <path className="miaixz-exception-soft" d="M463 190h13v46h-13Zm18 4h12v42h-12Z" />
      <path className="miaixz-exception-paper" d="M499 185h13v51h-13Z" />
      <path d="M468 227h3m15 0h3m15 0h3" />
      <rect className="miaixz-exception-paper" x="465" y="262" width="55" height="32" rx="2" />
      <path d="M465 270h55m-34 9h13" />
      <path className="miaixz-exception-paper" d="M464 66q25-7 45 3l13 31q-27 3-44-6Z" />
      <path className="miaixz-exception-soft" d="M523 112v15h17l3-15Z" />
      <path d="m533 112-2-17m1 6q-16-2-12-14 11-1 12 14Zm1-4q12-1 13-12-11-2-13 12Z" />
    </g>
  );
}

/**
 * Draws an unbranded filing cabinet with one empty open drawer.
 *
 * @returns Local inline artwork.
 */
export function FilingCabinet() {
  return (
    <g>
      <path className="miaixz-exception-paper" d="M190 202h106v104H190Z" />
      <path d="M190 253h106m-68-33h26v6h-26" />
      <path className="miaixz-exception-soft" d="m164 256 26-15h106l-27 15Z" />
      <path className="miaixz-exception-paper" d="M164 256h105v45H164Zm105 0 27-15v45l-27 15Z" />
      <path d="M204 273h25v6h-25" />
      <path className="miaixz-exception-paper" d="M246 163h12v39h-12Zm14-5h13v44h-13Z" />
      <path className="miaixz-exception-soft" d="M276 164h13v38h-13Z" />
      <path d="M250 194h3m11 0h4m12 0h4" />
      <path className="miaixz-exception-paper" d="m209 184 3 18h18l3-18Z" />
      <path d="m221 184-2-21m1 13q-16-2-14-14 13 0 14 14Zm0-5q13-2 15-14-13 0-15 14Z" />
    </g>
  );
}

/**
 * Draws a quiet unbranded service console, with a removable inspection hatch.
 *
 * @returns Local inline artwork.
 */
export function ServiceConsole() {
  return (
    <g>
      <rect className="miaixz-exception-paper" x="217" y="111" width="105" height="163" rx="4" />
      <path d="M228 124h83v30h-83Zm0 43h83v30h-83Zm0 43h83v48h-83Z" />
      <path className="miaixz-exception-soft" d="M237 133h27v11h-27Zm0 43h27v11h-27Z" />
      <path d="M278 137h23m-23 5h15m-15 37h23m-23 6h15m-37 54h24m-12-12v24" />
      <path d="M225 274v29m89-29v29m-97 0h18m70 0h18" />
    </g>
  );
}
