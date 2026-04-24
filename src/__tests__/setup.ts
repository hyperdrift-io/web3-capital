import '@testing-library/jest-dom'

if (typeof window.localStorage === 'undefined' || typeof window.localStorage.clear !== 'function') {
  let storage = new Map<string, string>()

  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, String(value))
      },
      removeItem: (key: string) => {
        storage.delete(key)
      },
      clear: () => {
        storage = new Map<string, string>()
      },
      key: (index: number) => Array.from(storage.keys())[index] ?? null,
      get length() {
        return storage.size
      },
    },
  })
}

// porto's Dialog module calls window.matchMedia during connector setup.
// jsdom doesn't implement it — provide a no-op stub.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
