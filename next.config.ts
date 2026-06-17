import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/furigana": ["./node_modules/kuromoji/dict/**/*"],
  },
};

export default nextConfig;

