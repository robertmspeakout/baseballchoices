import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

// Read build version from package.json (works on all deployment platforms)
let buildVersion = "v8.8";
try {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));
  buildVersion = `v${pkg.version}`;
} catch {
  // Fallback to default
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_VERSION: buildVersion,
  },
};

export default nextConfig;
