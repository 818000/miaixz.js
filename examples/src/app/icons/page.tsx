import type { Metadata } from "next";

import { IconsGuide } from "../../module/icons/icons-guide";

export const metadata: Metadata = { title: "Icons 指南" };

export default function IconsPage() {
  return <IconsGuide />;
}
