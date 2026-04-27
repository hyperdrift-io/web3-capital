/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  // Wormhole Connect is loaded via the /hosted CDN loader. The pre-built Vite
  // bundle resolves dynamic chunk imports relative to the page origin rather
  // than the CDN URL, causing 404s for /assets/*.js. Fix: proxy the widget
  // assets through our server so all chunk URLs stay on the same origin.
  async rewrites() {
    const WH_VERSION = '5.1.1'
    const CDN_DIST = `https://cdn.jsdelivr.net/npm/@wormhole-foundation/wormhole-connect@${WH_VERSION}/dist`
    return [
      // ES module imports resolve relative to the script URL (/wh-connect/dist/main.mjs)
      {
        source: '/wh-connect/dist/:path*',
        destination: `${CDN_DIST}/:path*`,
      },
      // Vite's preload polyfill computes chunk URLs against window.location.href
      // (/bridge) rather than the script URL — so these land at our origin.
      // /assets/* and /main.css → rewrite to CDN so the preloads resolve.
      {
        source: '/assets/:path*',
        destination: `${CDN_DIST}/assets/:path*`,
      },
      {
        source: '/main.css',
        destination: `${CDN_DIST}/main.css`,
      },
    ]
  },
  images: {
    remotePatterns: [
      { hostname: 'icons.llama.fi' },
      { hostname: 'assets.coingecko.com' },
    ],
  },
  webpack: (config) => {
    // Suppress "Critical dependency" warning from viem's tempo chain definition
    // which uses a dynamic require() in its internal worker pool. It's a
    // compile-time noise issue only — the chain is never used at runtime.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /viem[\\/]node_modules[\\/]ox[\\/]_esm[\\/]tempo/,
        message: /Critical dependency/,
      },
    ]

    // Stub optional third-party packages that can't resolve on web.
    // alias: false tells webpack to emit an empty module instead of erroring.
    // Applied to both client and server builds because wagmi (ssr:true) is
    // compiled for both, and these deps appear in the shared connector barrel.
    //
    // @metamask/sdk is pulled in by wagmi's connector barrel even though only
    // `injected` + `porto` are used. Stubbing it kills the React Native dep chain.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@metamask/sdk':                             false,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty':                               false,
      encoding:                                    false,
      // Bare 'accounts' specifier is referenced by @wagmi/core's tempo connector
      // shim. Not used at runtime — stub so webpack doesn't error.
      accounts:                                    false,
    }

    // resolve.fallback is correct for packages that shadow Node built-ins.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // These wallet connectors are optional peer deps — not installed.
      '@base-org/account':                false,
      '@coinbase/wallet-sdk':             false,
      '@safe-global/safe-apps-sdk':       false,
      '@safe-global/safe-apps-provider':  false,
      '@walletconnect/ethereum-provider': false,
    }
    return config
  },
}

export default nextConfig
