/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["openai", "@anthropic-ai/sdk"],
};

module.exports = nextConfig;
