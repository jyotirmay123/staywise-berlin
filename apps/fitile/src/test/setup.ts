import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverStub as typeof ResizeObserver

const memoryStorage = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => memoryStorage.set(key, value),
    removeItem: (key: string) => memoryStorage.delete(key),
    clear: () => memoryStorage.clear(),
    key: (index: number) => [...memoryStorage.keys()][index] ?? null,
    get length() { return memoryStorage.size },
  } satisfies Storage,
})
