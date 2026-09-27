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

import styles from "./brand-logo.module.css";

export interface BrandLogoProps {
  readonly className?: string;
}

/** Renders the unmodified Miaixz brand artwork for the active color mode. */
export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <span className={[styles.root, className].filter(Boolean).join(" ")}>
      <img
        alt="Miaixz"
        className={styles.light}
        height="796"
        src="/miaixz-primary-light.png"
        width="1003"
      />
      <img
        alt="Miaixz"
        className={styles.dark}
        height="796"
        src="/miaixz-primary-dark.png"
        width="1003"
      />
    </span>
  );
}
