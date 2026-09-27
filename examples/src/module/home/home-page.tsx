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

import { Icon } from "@miaixz/icons";
import {
  Alert,
  Button,
  Input,
  Select,
  Tabs,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
  type SelectEntry,
} from "@miaixz/ui";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { BrandLogo } from "../../shared/brand/brand-logo";
import styles from "./home-page.module.css";

const showcaseIcons = [
  "home",
  "search",
  "heart",
  "user-round",
  "settings",
  "bell",
  "folder",
  "file",
  "image",
  "link",
  "grid-2x2",
  "add",
  "external-link",
] as const;

type ShowcaseIconName = (typeof showcaseIcons)[number];

interface LeafStateIconProps {
  readonly filled?: boolean;
  readonly size: "display" | "feature" | "navigation";
}

/** The leaf artwork used by the approved home-page composition. */
function LeafStateIcon({ filled = false, size }: LeafStateIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={styles.leafStateIcon}
      data-filled={filled || undefined}
      data-size={size}
      viewBox="0 0 48 48"
    >
      {filled ? (
        <>
          <path d="M26.2 4.7c1.1 10.8-3.1 18.9-13.6 24.4C9.8 18.8 14.4 10.6 26.2 4.7Z" />
          <path d="M43.1 15.8c-.1 12.8-6.6 20.3-19.4 22.5-1.6-11.5 4.9-19 19.4-22.5Z" />
          <path d="M22.8 21.2c2.4 10-1.3 17.4-11.2 22.1-2.7-9.2 1-16.6 11.2-22.1Z" />
          <path d="M12.2 44.1c4.7-10.9 12.6-19.1 23.7-24.5" fill="none" />
        </>
      ) : (
        <>
          <path d="M25.8 5.2c1 10.5-3.2 18.4-12.9 23.8C10 18.9 14.4 10.9 25.8 5.2Z" />
          <path d="M40.9 17.1c-.4 11.5-6.2 18.4-17.6 20.7-1.3-10.4 4.6-17.3 17.6-20.7Z" />
          <path d="M11.1 43.5c4.2-10.7 11.8-18.7 22.6-24" />
        </>
      )}
    </svg>
  );
}

function ShowcaseGlyph({ name }: { readonly name: ShowcaseIconName }) {
  const paths: Record<ShowcaseIconName, ReactNode> = {
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    "user-round": (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0Z" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />,
    folder: <path d="M3 6h7l2 2h9v11H3Z" />,
    file: (
      <>
        <path d="M6 2h8l4 4v16H6Z" />
        <path d="M14 2v5h5M9 12h6M9 16h6" />
      </>
    ),
    image: (
      <>
        <rect height="18" rx="2" width="20" x="2" y="3" />
        <circle cx="8" cy="9" r="2" />
        <path d="m21 15-5-5L5 21" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
        <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
      </>
    ),
    "grid-2x2": (
      <>
        <rect height="7" width="7" x="3" y="3" />
        <rect height="7" width="7" x="14" y="3" />
        <rect height="7" width="7" x="3" y="14" />
        <rect height="7" width="7" x="14" y="14" />
      </>
    ),
    add: <path d="M12 4v16M4 12h16" />,
    "external-link": (
      <>
        <path d="M14 3h7v7M10 14 21 3" />
        <path d="M21 14v7H3V3h7" />
      </>
    ),
  };

  return (
    <svg aria-hidden="true" className={styles.showcaseGlyph} viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

function SunGlyph() {
  return (
    <svg aria-hidden="true" className={styles.showcaseGlyph} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.2 2.2M17.2 17.2l2.2 2.2M19.4 4.6l-2.2 2.2M6.8 17.2l-2.2 2.2" />
    </svg>
  );
}

function MoonGlyph() {
  return (
    <svg aria-hidden="true" className={styles.showcaseGlyph} viewBox="0 0 24 24">
      <path d="M20.5 15.2A8.8 8.8 0 0 1 8.8 3.5 8.9 8.9 0 1 0 20.5 15.2Z" />
    </svg>
  );
}

function CopyGlyph() {
  return (
    <svg aria-hidden="true" className={styles.copyGlyph} viewBox="0 0 16 16">
      <rect height="9" rx="1" width="8" x="5.5" y="1.5" />
      <path d="M10.5 5.5h-7a1 1 0 0 0-1 1v7h8a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1Z" />
    </svg>
  );
}

const chartValues = [30, 42, 49, 58, 66, 88] as const;

const copy = {
  "en-US": {
    nav: ["Components", "Icons", "SDK", "View", "Guides"],
    search: "Search components...",
    getStarted: "Get started",
    metrics: [
      ["118", "Components"],
      ["1024", "Icons"],
      ["11", "Themes"],
    ],
    headline: ["Build clear interfaces", "for complex products."],
    subhead: "118 components, one consistent design language.",
    browse: "Browse components",
    guide: "Read the guide",
    preview: "Preview",
    code: "Code",
    accessibility: "Accessibility",
    properties: "Properties",
    tone: "Tone",
    variant: "Variant",
    size: "Size",
    state: "State",
    neutral: "Neutral",
    brand: "Brand",
    danger: "Danger",
    solid: "Solid",
    outlined: "Outlined",
    plain: "Plain",
    small: "Small",
    medium: "Medium",
    large: "Large",
    enabled: "Default",
    disabled: "Disabled",
    iconState: "Icon state",
    contrast: "AA contrast",
    keyboard: "Keyboard ready",
    source: "Source code",
    copy: "Copy",
    copied: "Copied",
    accessibilityTitle: "Accessible by default",
    accessibilityBody:
      "Keyboard focus, semantic controls, and contrast-safe states are built into the component contract.",
    systemEyebrow: "One system. Four foundations.",
    systemTitle: ["Built to work together.", "Free to evolve alone."],
    systemBody: [
      "UI, Icons, SDK, and View share one visual foundation.",
      "Each package stays focused, composable, and independently useful.",
    ],
    shared: "Shared foundation",
    packageDescriptions: {
      ui: "118 components",
      icons: "1024 glyphs",
      sdk: "Typed clients",
      view: "Data previews",
    },
    field: "Text field",
    cancel: "Cancel",
    accessible: "Accessible",
    accessibleHint: "Meets AA contrast standards.",
    explore: ["Explore UI", "Browse icons", "Read SDK", "Open View"],
    footer: "Designed as a system. Shipped as focused packages.",
    menu: "Open navigation",
    closeMenu: "Close navigation",
  },
} as const;

type HomeCopy = (typeof copy)[keyof typeof copy];

function createSelectItems(
  scope: string,
  entries: readonly (readonly [value: string, label: string])[],
): readonly SelectEntry[] {
  return entries.map(([value, label]) => ({
    id: `${scope}-${value}`,
    kind: "option" as const,
    label,
    textValue: label,
    value,
  }));
}

function scrollToSystem(): void {
  document.getElementById("system")?.scrollIntoView({ behavior: "smooth" });
}

interface ComponentLabProps {
  readonly labels: HomeCopy;
}

function ComponentLab({ labels }: ComponentLabProps) {
  const [tone, setTone] = useState<ButtonTone>("neutral");
  const [variant, setVariant] = useState<ButtonVariant>("solid");
  const [size, setSize] = useState<ButtonSize>("medium");
  const [disabled, setDisabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const resetCopyTimer = useRef<number | undefined>(undefined);

  const source = useMemo(
    () =>
      `<Button tone="${tone}" variant="${variant}"${size === "medium" ? "" : ` size="${size}"`}${disabled ? " disabled" : ""}>\n  ${labels.getStarted}\n</Button>`,
    [disabled, labels.getStarted, size, tone, variant],
  );
  const toneItems = useMemo(
    (): readonly SelectEntry[] =>
      (
        [
          ["neutral", labels.neutral],
          ["brand", labels.brand],
          ["danger", labels.danger],
        ] as const
      ).map(([value, label]) => ({
        id: `tone-${value}`,
        kind: "option" as const,
        label: (
          <span className={styles.toneOption}>
            <span className={styles.toneSwatch} data-tone={value} />
            {label}
          </span>
        ),
        textValue: label,
        value,
      })),
    [labels.brand, labels.danger, labels.neutral],
  );
  const variantItems = useMemo(
    () =>
      createSelectItems("variant", [
        ["solid", labels.solid],
        ["outlined", labels.outlined],
        ["plain", labels.plain],
      ]),
    [labels.outlined, labels.plain, labels.solid],
  );
  const sizeItems = useMemo(
    () =>
      createSelectItems("size", [
        ["small", labels.small],
        ["medium", labels.medium],
        ["large", labels.large],
      ]),
    [labels.large, labels.medium, labels.small],
  );
  const stateItems = useMemo(
    () =>
      createSelectItems("state", [
        ["enabled", labels.enabled],
        ["disabled", labels.disabled],
      ]),
    [labels.disabled, labels.enabled],
  );

  useEffect(
    () => () => {
      if (resetCopyTimer.current !== undefined) window.clearTimeout(resetCopyTimer.current);
    },
    [],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      if (resetCopyTimer.current !== undefined) window.clearTimeout(resetCopyTimer.current);
      resetCopyTimer.current = window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  const preview = (
    <div className={styles.labPreview}>
      <div className={styles.buttonPreview}>
        <span>Button</span>
        <Button disabled={disabled} size={size} tone={tone} variant={variant}>
          {labels.getStarted}
        </Button>
      </div>
      <div className={styles.iconPreview}>
        <span>{labels.iconState}</span>
        <div aria-label={labels.iconState} className={styles.iconMorph}>
          <LeafStateIcon size="display" />
          <Icon name="arrow-right" size="navigation" />
          <LeafStateIcon filled size="display" />
        </div>
      </div>
      <div className={styles.assuranceStrip}>
        <span>
          <Icon name="circle-check-big" size="navigation" fill={1} />
          {labels.contrast}
        </span>
        <span>
          <Icon name="circle-check-big" size="navigation" fill={1} />
          {labels.keyboard}
        </span>
      </div>
    </div>
  );

  const codePanel = (
    <pre className={styles.tabCode}>
      <code>{source}</code>
    </pre>
  );

  const accessibilityPanel = (
    <div className={styles.accessibilityPanel}>
      <Icon name="accessibility" size="display" />
      <div>
        <strong>{labels.accessibilityTitle}</strong>
        <p>{labels.accessibilityBody}</p>
      </div>
    </div>
  );

  return (
    <article aria-label="Interactive component preview" className={styles.lab}>
      <div className={styles.labWorkspace}>
        <Tabs
          defaultValue="preview"
          items={[
            { value: "preview", label: labels.preview, content: preview },
            { value: "code", label: labels.code, content: codePanel },
            {
              value: "accessibility",
              label: labels.accessibility,
              content: accessibilityPanel,
            },
          ]}
          label="Component preview modes"
          panelPadding="none"
        />
      </div>

      <aside className={styles.properties}>
        <h2>{labels.properties}</h2>
        <div className={styles.propertyField}>
          <span>{labels.tone}</span>
          <Select
            aria-label={labels.tone}
            items={toneItems}
            size="small"
            value={tone}
            onValueChange={(value) => setTone(value as ButtonTone)}
          />
        </div>
        <div className={styles.propertyField}>
          <span>{labels.variant}</span>
          <Select
            aria-label={labels.variant}
            items={variantItems}
            size="small"
            value={variant}
            onValueChange={(value) => setVariant(value as ButtonVariant)}
          />
        </div>
        <div className={styles.propertyField}>
          <span>{labels.size}</span>
          <Select
            aria-label={labels.size}
            items={sizeItems}
            size="small"
            value={size}
            onValueChange={(value) => setSize(value as ButtonSize)}
          />
        </div>
        <div className={styles.propertyField}>
          <span>{labels.state}</span>
          <Select
            aria-label={labels.state}
            items={stateItems}
            size="small"
            value={disabled ? "disabled" : "enabled"}
            onValueChange={(value) => setDisabled(value === "disabled")}
          />
        </div>
      </aside>

      <div className={styles.sourcePanel}>
        <div className={styles.sourceHeader}>
          <span>{labels.source}</span>
          <Button
            size="small"
            startIcon={copied ? <Icon name="circle-check" size="inline" /> : <CopyGlyph />}
            tone="neutral"
            variant="plain"
            onClick={handleCopy}
          >
            {copied ? labels.copied : labels.copy}
          </Button>
        </div>
        <div className={styles.sourceBody}>
          <span aria-hidden="true" className={styles.lineNumbers}>
            1<br />2<br />3
          </span>
          <pre>
            <code>
              <span className={styles.sourceTag}>&lt;Button </span>
              <span className={styles.sourceAttribute}>tone</span>
              <span className={styles.sourceTag}>=</span>
              <span className={styles.sourceValue}>&quot;{tone}&quot;</span>
              <span className={styles.sourceTag}> variant=</span>
              <span className={styles.sourceValue}>&quot;{variant}&quot;</span>
              {size === "medium" ? null : (
                <>
                  <span className={styles.sourceTag}> size=</span>
                  <span className={styles.sourceValue}>&quot;{size}&quot;</span>
                </>
              )}
              {disabled ? <span className={styles.sourceAttribute}> disabled</span> : null}
              <span className={styles.sourceTag}>&gt;{"\n"}</span>
              <span className={styles.sourceText}> {` ${labels.getStarted}\n`}</span>
              <span className={styles.sourceTag}>&lt;/Button&gt;</span>
            </code>
          </pre>
        </div>
      </div>

      <svg
        aria-hidden="true"
        className={styles.labConnections}
        preserveAspectRatio="none"
        viewBox="0 0 1000 1000"
      >
        <path d="M213 302C315 137 515 137 668 178" />
        <path d="M213 302C213 430 20 595 70 805" />
        <circle cx="213" cy="302" r="8" />
        <circle cx="668" cy="178" r="8" />
        <circle cx="70" cy="805" r="8" />
      </svg>
    </article>
  );
}

interface HeaderProps {
  readonly labels: HomeCopy;
}

function Header({ labels }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const targets = ["system", "icons", "sdk", "view", "system"];

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    scrollToSystem();
  };

  const updateQuery = (event: ChangeEvent<HTMLInputElement>) => setQuery(event.currentTarget.value);

  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <a aria-label="Miaixz examples home" className={styles.brandLink} href="#top">
          <BrandLogo />
        </a>
        <nav aria-label="Primary navigation" className={styles.primaryNav}>
          {labels.nav.map((label, index) => (
            <a href={`#${targets[index]}`} key={label}>
              {label}
            </a>
          ))}
        </nav>
        <form className={styles.search} onSubmit={submitSearch} role="search">
          <Input
            aria-label={labels.search}
            onChange={updateQuery}
            placeholder={labels.search}
            startAdornment={<Icon name="search" size="control" />}
            value={query}
          />
          <span aria-live="polite" className={styles.visuallyHidden}>
            {query ? `${labels.search} ${query}` : ""}
          </span>
        </form>
        <Button
          className={styles.headerCta}
          size="medium"
          tone="neutral"
          variant="outlined"
          onClick={scrollToSystem}
        >
          {labels.getStarted}
        </Button>
        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? labels.closeMenu : labels.menu}
          className={styles.menuButton}
          onClick={() => setMenuOpen((current) => !current)}
          type="button"
        >
          <Icon name={menuOpen ? "close" : "menu"} size="navigation" />
        </button>
      </div>
      {menuOpen ? (
        <nav aria-label="Mobile navigation" className={styles.mobileNav}>
          {labels.nav.map((label, index) => (
            <a href={`#${targets[index]}`} key={label} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
        </nav>
      ) : null}
    </header>
  );
}

interface SystemSectionProps {
  readonly labels: HomeCopy;
}

function UsageTable() {
  return (
    <table className={styles.usageTable}>
      <thead>
        <tr>
          <th>Month</th>
          <th>Usage</th>
        </tr>
      </thead>
      <tbody>
        {[
          ["Jan", "1,240"],
          ["Feb", "1,560"],
          ["Mar", "2,310"],
          ["Apr", "2,980"],
          ["May", "3,420"],
          ["Jun", "4,120"],
        ].map(([month, usage]) => (
          <tr key={month}>
            <td>{month}</td>
            <td>{usage}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function UsageBars() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] as const;

  return (
    <div aria-label="Monthly usage chart" className={styles.bars} role="img">
      <div className={styles.barsPlot}>
        {chartValues.map((value, index) => (
          <span
            className={`${styles.bar} ${index === chartValues.length - 1 ? styles.activeBar : ""}`}
            key={value}
            style={{ height: `${String(value)}%` }}
          >
            {index === chartValues.length - 1 ? <b>4,120</b> : null}
          </span>
        ))}
      </div>
      <div aria-hidden="true" className={styles.chartLabels}>
        {months.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  );
}

function SystemSection({ labels }: SystemSectionProps) {
  return (
    <section className={styles.systemSection} id="system">
      <div className={styles.systemIntro}>
        <p className={styles.eyebrow}>{labels.systemEyebrow}</p>
        <h2>
          {labels.systemTitle.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>
        <p>
          {labels.systemBody.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
      </div>
      <span aria-hidden="true" className={`${styles.noteArtwork} ${styles.systemNoteArtwork}`} />

      <div className={styles.systemCanvas}>
        <div aria-hidden="true" className={styles.connections}>
          <svg preserveAspectRatio="none" viewBox="0 0 818 668">
            <g className={styles.connectionLines}>
              <path d="M348 44C394 44 372 219 409 219" />
              <path d="M470 44C424 44 446 219 409 219" />
              <path d="M182 300C182 337 319 316 348 334" />
              <path d="M636 300C636 337 499 316 470 334" />
              <path d="M182 368C182 334 319 352 348 334" />
              <path d="M636 368C636 334 499 352 470 334" />
              <path d="M348 624C394 624 372 449 409 449" />
              <path d="M470 624C424 624 446 449 409 449" />
              <path d="M409 219L409 449" />
            </g>
            <g className={styles.connectionNodes}>
              {[
                [348, 44],
                [470, 44],
                [182, 300],
                [636, 300],
                [348, 334],
                [470, 334],
                [182, 368],
                [636, 368],
                [348, 624],
                [470, 624],
                [409, 219],
                [409, 449],
              ].map(([cx, cy]) => (
                <circle cx={cx} cy={cy} key={`${String(cx)}-${String(cy)}`} r="5" />
              ))}
            </g>
          </svg>
        </div>

        <article className={`${styles.systemCard} ${styles.uiCard}`} id="ui">
          <header>
            <div>
              <h3>UI</h3>
              <p>{labels.packageDescriptions.ui}</p>
            </div>
          </header>
          <div className={styles.uiPreview}>
            <Tabs
              defaultValue="button"
              items={[
                {
                  value: "button",
                  label: "Button",
                  content: (
                    <div className={styles.uiDemoBody}>
                      <div className={styles.miniActions}>
                        <Button tone="neutral" variant="solid">
                          {labels.getStarted}
                        </Button>
                        <Button tone="neutral" variant="outlined">
                          {labels.cancel}
                        </Button>
                      </div>
                      <Input
                        aria-label={labels.field}
                        placeholder={labels.field}
                        endAdornment={<Icon name="search" size="control" />}
                      />
                      <Alert title={labels.accessible} tone="success">
                        {labels.accessibleHint}
                      </Alert>
                    </div>
                  ),
                },
                {
                  value: "input",
                  label: "Input",
                  content: (
                    <div className={styles.uiDemoBody}>
                      <Input
                        aria-label={labels.field}
                        placeholder={labels.field}
                        startAdornment={<Icon name="search" size="control" />}
                      />
                    </div>
                  ),
                },
                {
                  value: "tabs",
                  label: "Tabs",
                  content: <p className={styles.uiDemoText}>{labels.accessibilityBody}</p>,
                },
                {
                  value: "alert",
                  label: "Alert",
                  content: (
                    <div className={styles.uiDemoBody}>
                      <Alert title={labels.accessible} tone="success">
                        {labels.accessibleHint}
                      </Alert>
                    </div>
                  ),
                },
              ]}
              label="UI component preview"
              panelPadding="none"
            />
          </div>
        </article>

        <article className={`${styles.systemCard} ${styles.iconsCard}`} id="icons">
          <header>
            <div>
              <h3>Icons</h3>
              <p>{labels.packageDescriptions.icons}</p>
            </div>
          </header>
          <div className={styles.iconGrid}>
            {showcaseIcons.slice(0, 10).map((name) => (
              <span key={name}>
                <ShowcaseGlyph name={name} />
              </span>
            ))}
            <span aria-label={labels.iconState} className={styles.iconStateCell}>
              <LeafStateIcon size="navigation" />
              <Icon name="arrow-right" size="inline" />
              <LeafStateIcon filled size="navigation" />
            </span>
            <span>
              <ShowcaseGlyph name={showcaseIcons[10]} />
            </span>
            <span>
              <ShowcaseGlyph name={showcaseIcons[11]} />
            </span>
            <span aria-hidden="true" className={styles.minusGlyph} />
            <span>
              <SunGlyph />
            </span>
            <span>
              <MoonGlyph />
            </span>
            <span>
              <ShowcaseGlyph name={showcaseIcons[12]} />
            </span>
          </div>
        </article>

        <article className={`${styles.systemCard} ${styles.sdkCard}`} id="sdk">
          <header>
            <div>
              <h3>SDK</h3>
              <p>{labels.packageDescriptions.sdk}</p>
            </div>
          </header>
          <div className={styles.sdkCode}>
            <span aria-hidden="true" className={styles.sdkLineNumbers}>
              1{"\n"}2{"\n"}3{"\n"}4{"\n"}5{"\n"}6{"\n"}7{"\n"}8
            </span>
            <pre>
              <code>
                <span>import</span> {"{ Button }"} <span>from</span> <b>"@miaixz/ui"</b>;{"\n\n"}
                <span>const</span> button = <span>new</span> Button({"{"}
                {"\n  "}tone: <b>"neutral"</b>,{"\n  "}variant: <b>"solid"</b>,{"\n  "}size:{" "}
                <b>"medium"</b>,{"\n"}
                {"}"});{"\n"}
                button.<span>render</span>();
              </code>
            </pre>
          </div>
        </article>

        <article className={`${styles.systemCard} ${styles.viewCard}`} id="view">
          <header>
            <div>
              <h3>View</h3>
              <p>{labels.packageDescriptions.view}</p>
            </div>
          </header>
          <div className={styles.viewPreview}>
            <Tabs
              defaultValue="chart"
              items={[
                { value: "table", label: "Table", content: <UsageTable /> },
                {
                  value: "chart",
                  label: "Chart",
                  content: (
                    <div className={styles.chartArea}>
                      <UsageTable />
                      <UsageBars />
                    </div>
                  ),
                },
                {
                  value: "json",
                  label: "JSON",
                  content: (
                    <pre className={styles.viewJson}>{`{ "month": "Jun", "usage": 4120 }`}</pre>
                  ),
                },
              ]}
              label="View preview modes"
              panelPadding="none"
            />
          </div>
        </article>

        <div className={styles.foundation}>{labels.shared}</div>
      </div>

      <nav aria-label="Package examples" className={styles.packageLinks}>
        {labels.explore.map((label, index) => (
          <a href={`#${["ui", "icons", "sdk", "view"][index]}`} key={label}>
            {label} <Icon name="arrow-right" size="inline" />
          </a>
        ))}
      </nav>
      <p className={styles.footerNote}>{labels.footer}</p>
    </section>
  );
}

/** Renders the first Miaixz examples interface. */
export function HomePage() {
  const labels = copy["en-US"];

  return (
    <div className={styles.page} id="top">
      <Header labels={labels} />
      <main>
        <section className={styles.hero}>
          <ol aria-label="Library metrics" className={styles.metrics}>
            {labels.metrics.map(([value, label], index) => (
              <li data-active={index === 0 ? "true" : undefined} key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </li>
            ))}
          </ol>

          <div className={styles.heroCopy}>
            <h1>
              {labels.headline.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h1>
            <p>{labels.subhead}</p>
            <div className={styles.heroActions}>
              <Button onClick={scrollToSystem} size="large" tone="brand" variant="solid">
                {labels.browse}
              </Button>
              <a href="https://github.com/818000/miaixz.js#readme" rel="noreferrer" target="_blank">
                {labels.guide}
              </a>
            </div>
            <span
              aria-hidden="true"
              className={`${styles.noteArtwork} ${styles.heroNoteArtwork}`}
            />
          </div>

          <ComponentLab labels={labels} />

          <nav aria-label="Package overview" className={styles.packageRail}>
            {[
              ["UI", labels.packageDescriptions.ui, "ui"],
              ["Icons", labels.packageDescriptions.icons, "icons"],
              ["SDK", labels.packageDescriptions.sdk, "sdk"],
              ["View", labels.packageDescriptions.view, "view"],
            ].map(([name, description, target], index) => (
              <a data-active={index === 0 ? "true" : undefined} href={`#${target}`} key={name}>
                <strong>{name}</strong>
                <span>{description}</span>
              </a>
            ))}
          </nav>
        </section>

        <SystemSection labels={labels} />
      </main>
    </div>
  );
}
