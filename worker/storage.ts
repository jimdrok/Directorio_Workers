export interface Storage {
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<boolean>;
  list<T>(options: { prefix: string }): Promise<Map<string, T>>;
  transaction<T>(callback: (storage: Storage) => Promise<T>): Promise<T>;
}
interface Envelope {
  chunks: number;
}
// Durable Object KV values have a per-value limit; split image-heavy profiles.
export class ChunkedStorage implements Storage {
  constructor(private raw: Storage) {}
  async get<T>(key: string): Promise<T | undefined> {
    const envelope = await this.raw.get<Envelope>(key);
    if (!envelope) return undefined;
    const parts = await Promise.all(
      Array.from({ length: envelope.chunks }, (_, i) => this.raw.get<string>(`chunk:${key}:${i}`)),
    );
    return JSON.parse(parts.join('')) as T;
  }
  async put(key: string, value: unknown) {
    const text = JSON.stringify(value),
      size = 24000;
    const previous = await this.raw.get<Envelope>(key);
    const chunks = Math.ceil(text.length / size);
    for (let i = 0; i < chunks; i++)
      await this.raw.put(`chunk:${key}:${i}`, text.slice(i * size, (i + 1) * size));
    await this.raw.put(key, { chunks });
    for (let i = chunks; i < (previous?.chunks ?? 0); i++)
      await this.raw.delete(`chunk:${key}:${i}`);
  }
  async delete(key: string) {
    const envelope = await this.raw.get<Envelope>(key);
    if (!envelope) return false;
    for (let i = 0; i < envelope.chunks; i++) await this.raw.delete(`chunk:${key}:${i}`);
    return this.raw.delete(key);
  }
  async list<T>(options: { prefix: string }) {
    const entries = await this.raw.list<Envelope>(options);
    const values = new Map<string, T>();
    for (const key of entries.keys()) {
      const value = await this.get<T>(key);
      if (value !== undefined) values.set(key, value);
    }
    return values;
  }
  transaction<T>(callback: (storage: Storage) => Promise<T>): Promise<T> {
    return this.raw.transaction((tx) => callback(new ChunkedStorage(tx)));
  }
}
