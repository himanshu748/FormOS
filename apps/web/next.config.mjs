/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@formos/ui", "@formos/api", "@formos/db"],
  // Keep the Postgres driver out of the bundler; it's used server-side only.
  serverExternalPackages: ["postgres"],
  // Linting is run from the repo root via flat ESLint config (`pnpm lint`).
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
