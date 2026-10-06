/**
 * Configures the guide application to compile the four local Miaixz packages.
 */
import type { NextConfig } from "next";

/**
 * Local-package transpilation and React behavior used by the interactive guides.
 */
const nextConfig: NextConfig = {
  agentRules: false,
  reactStrictMode: false,
  transpilePackages: ["@miaixz/icons", "@miaixz/sdk", "@miaixz/ui", "@miaixz/view"],
};

export default nextConfig;
