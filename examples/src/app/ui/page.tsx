import type { Metadata } from "next";

import { UiWorkbench } from "../../module/ui/ui-workbench";

export const metadata: Metadata = { title: "UI 指南" };

export default function UiPage() {
  return <UiWorkbench />;
}
