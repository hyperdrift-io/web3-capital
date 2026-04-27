/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Note: wormhole-connect is no longer bundled by webpack at all.
  // BridgeWidget uses the package's /hosted export which injects the pre-built
  // Vite bundle from jsDelivr CDN as a native <script type="module">.
  // The /hosted shim itself is tiny and webpack-safe.
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
