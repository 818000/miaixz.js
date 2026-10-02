import type { Metadata } from "next";

import { ViewGuide } from "../../module/view/view-guide";

export const metadata: Metadata = { title: "View 指南" };

export default function ViewPage() {
  return <ViewGuide />;
}
