/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@base-ui/react'],
}

export default nextConfig

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
