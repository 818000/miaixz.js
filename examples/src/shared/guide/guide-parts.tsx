import type { ReactNode } from "react";

import styles from "./guide-parts.module.css";

interface GuideHeaderProps {
  readonly packageName: string;
  readonly title: string;
  readonly description: string;
  readonly children?: ReactNode;
}

/**
 * Opens a package guide with a stable title and installation command.
 */
export function GuideHeader({ packageName, title, description, children }: GuideHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headingCopy}>
        <p className={styles.packageName}>{packageName}</p>
        <h1>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
      <div className={styles.install} aria-label="安装命令">
        <span>npm install</span>
        <code>{packageName}</code>
      </div>
      {children}
    </header>
  );
}

interface GuideSectionProps {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly id?: string;
}

/**
 * Groups one focused concept and its live example.
 */
export function GuideSection({ title, description, children, id }: GuideSectionProps) {
  return (
    <section className={styles.section} id={id}>
      <div className={styles.sectionHeading}>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

interface CodeBlockProps {
  readonly children: string;
  readonly label?: string;
}

/**
 * Renders a compact copy-ready code sample.
 */
export function CodeBlock({ children, label = "示例代码" }: CodeBlockProps) {
  return (
    <div className={styles.codeBlock}>
      <div className={styles.codeLabel}>{label}</div>
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  );
}

interface StatProps {
  readonly label: string;
  readonly value: ReactNode;
  readonly detail?: string;
}

/**
 * Presents one factual runtime or catalog measurement.
 */
export function Stat({ label, value, detail }: StatProps) {
  return (
    <div className={styles.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}
