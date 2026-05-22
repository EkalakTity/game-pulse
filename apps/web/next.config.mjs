/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const cspDirectives = [
  "default-src 'self'",
  isProd
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https: http:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https:",
  "frame-ancestors 'none'",
];

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: cspDirectives.join("; ") },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig = {
  output: "standalone",
  transpilePackages: ["@gamepulse/types", "@gamepulse/config"],
  experimental: {
    serverComponentsExternalPackages: ["@anthropic-ai/sdk", "@prisma/client", "@gamepulse/database"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
