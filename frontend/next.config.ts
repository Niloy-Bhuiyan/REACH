import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Dev only: Next refuses cross-origin dev requests unless the origin is named here, which is
   * what a phone on the same network is. Local addresses only.
   */
  allowedDevOrigins: ["192.168.1.143", "192.168.1.*", "localhost", "127.0.0.1"],

  /**
   * The Final Handoff Index §03 names `/discover/:jobId` and `/fix/:blockerId`. The build brief
   * names `/jobs/[id]` and `/one-fix/[id]`. The brief wins on the URL string; both handoff paths
   * are preserved here so nothing specified against them breaks.
   */
  async redirects() {
    return [
      { source: "/discover/:jobId", destination: "/jobs/:jobId", permanent: true },
      { source: "/fix/:blockerId", destination: "/one-fix/:blockerId", permanent: true },
    ];
  },
};

export default nextConfig;
