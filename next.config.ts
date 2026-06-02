import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App 100% client-side (localStorage). Sem rotas de API, sem Cache Components.
  reactStrictMode: true,
};

export default nextConfig;
