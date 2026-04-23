/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Wormhole Connect and its SDK use ESM — Next.js needs to transpile them
  transpilePackages: ['@wormhole-foundation/wormhole-connect'],
  images: {
    remotePatterns: [
      { hostname: 'icons.llama.fi' },
      { hostname: 'assets.coingecko.com' },
    ],
  },
  webpack: (config) => {
    // Optional wallet connector peer deps — only installed if those wallets are needed
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@base-org/account':                false,
      '@coinbase/wallet-sdk':             false,
      '@metamask/sdk':                    false,
      '@safe-global/safe-apps-sdk':       false,
      '@safe-global/safe-apps-provider':  false,
      '@walletconnect/ethereum-provider': false,
    }
    return config
  },
}

export default nextConfig
