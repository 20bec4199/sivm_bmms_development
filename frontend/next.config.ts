import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy API calls so the browser sees the backend as same-origin (first-party cookies).
  async rewrites() {
    const backend = process.env.BACKEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : undefined);
    if (!backend) return [];
    return [{ source: '/backend-api/:path*', destination: `${backend.replace(/\/+$/, '')}/:path*` }];
  },
};

export default nextConfig;
