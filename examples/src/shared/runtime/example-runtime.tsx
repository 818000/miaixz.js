"use client";

import { createMiaixzAppearanceManager, createMiaixzI18n } from "@miaixz/sdk";
import { MiaixzDocumentLocale, MiaixzLocaleProvider, Theme } from "@miaixz/ui";
import { useEffect, useState, type ReactNode } from "react";

interface ExampleRuntimeProps {
  readonly children: ReactNode;
}

/**
 * Supplies one shared Miaixz appearance and locale runtime to every guide route.
 */
export function ExampleRuntime({ children }: ExampleRuntimeProps) {
  const [appearance] = useState(() =>
    createMiaixzAppearanceManager({
      appId: "miaixz-examples",
      initialAppearance: {
        theme: "miaixz",
        colorMode: "system",
        density: "standard",
      },
    }),
  );
  const [i18n] = useState(() => createMiaixzI18n({ locale: "zh-CN", fallbackLocale: "en-US" }));

  useEffect(
    () => () => {
      appearance.destroy();
    },
    [appearance],
  );

  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <MiaixzDocumentLocale />
      <Theme appearance={appearance}>{children}</Theme>
    </MiaixzLocaleProvider>
  );
}
