import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  reactStrictMode: false,
  transpilePackages: ["@miaixz/icons", "@miaixz/sdk", "@miaixz/ui", "@miaixz/view"],
};

export default nextConfig;
