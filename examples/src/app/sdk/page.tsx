import type { Metadata } from "next";

import { SdkGuide } from "../../module/sdk/sdk-guide";

export const metadata: Metadata = { title: "SDK 指南" };

export default function SdkPage() {
  return <SdkGuide />;
}
