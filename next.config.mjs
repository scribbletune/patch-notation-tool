/** @type {import('next').NextConfig} */
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserPagesRepo = repositoryName.endsWith(".github.io");
const basePath =
  process.env.GITHUB_ACTIONS === "true" && repositoryName && !isUserPagesRepo
    ? `/${repositoryName}`
    : "";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath,
  assetPrefix: basePath || undefined
};

export default nextConfig;
