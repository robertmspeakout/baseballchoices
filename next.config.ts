import type { NextConfig } from "next";
import { execSync } from "child_process";

// Auto-increment build version from git commit count.
// Offset so that commit 89 = v8.8, commit 90 = v8.9, etc.
const BUILD_OFFSET = 81;
let buildVersion = "v8.8";
try {
  const count = parseInt(execSync("git rev-list --count HEAD").toString().trim(), 10);
  buildVersion = `v8.${count - BUILD_OFFSET}`;
} catch {
  // Outside git or git unavailable — use default
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_VERSION: buildVersion,
  },
};

export default nextConfig;
