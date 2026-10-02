import "@miaixz/icons/styles.css";
import "@miaixz/ui/styles.css";
import "@miaixz/view/styles.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { GuideShell } from "../shared/guide/guide-shell";
import { ExampleRuntime } from "../shared/runtime/example-runtime";
import "./styles/global.css";

export const metadata: Metadata = {
  title: {
    default: "Miaixz Guides",
    template: "%s | Miaixz Guides",
  },
  description: "@miaixz/ui、icons、sdk 与 view 的可运行接入指南。",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="zh-CN" suppressHydrationWarning>
      <body>
        <ExampleRuntime>
          <GuideShell>{children}</GuideShell>
        </ExampleRuntime>
      </body>
    </html>
  );
}
