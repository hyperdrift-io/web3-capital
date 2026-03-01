/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
