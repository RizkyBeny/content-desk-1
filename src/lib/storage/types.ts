export interface StorageObject {
  key: string;
  size: number;
  contentType: string;
}

export interface StorageStat {
  size: number;
  contentType: string;
}

/**
 * Storage adapter contract. Implementations: local filesystem (dev) and
 * S3-compatible object storage (prod). Keys are relative, POSIX-style paths.
 */
export interface StorageAdapter {
  readonly driver: "local" | "s3";
  /** Persist a buffer and return its stored metadata. */
  put(key: string, data: Buffer, contentType: string): Promise<StorageObject>;
  /** Read a stored object, or null when missing. */
  get(key: string): Promise<Buffer | null>;
  /** Delete a stored object (no error when missing). */
  delete(key: string): Promise<void>;
  /** Whether an object exists. */
  exists(key: string): Promise<boolean>;
  /** Object metadata, or null when missing. */
  stat(key: string): Promise<StorageStat | null>;
  /** Time-limited download URL for a key. */
  url(key: string, ttlSeconds?: number): string;
}
