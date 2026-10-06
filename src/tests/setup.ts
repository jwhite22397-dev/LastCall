const memory = new Map<string, string>();

const localStorageMock = {
  get length() {
    return memory.size;
  },
  clear(): void {
    memory.clear();
  },
  getItem(key: string): string | null {
    return memory.has(key) ? memory.get(key)! : null;
  },
  key(index: number): string | null {
    return Array.from(memory.keys())[index] ?? null;
  },
  removeItem(key: string): void {
    memory.delete(key);
  },
  setItem(key: string, value: string): void {
    memory.set(key, String(value));
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});
