import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getEnv } from "@/lib/env";
import { fileUrl } from "./sign";
import { guessContentType } from "./mime";
import type { StorageAdapter, StorageObject } from "./types";

let client: S3Client | null = null;

function getClient(): S3Client {
  const env = getEnv();
  if (!env.S3_ENDPOINT || !env.S3_BUCKET) {
    throw new Error("S3 storage belum dikonfigurasi (S3_ENDPOINT/S3_BUCKET).");
  }
  if (!client) {
    client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  const stream = body as AsyncIterable<Uint8Array>;
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export const s3Storage: StorageAdapter = {
  driver: "s3",

  async put(key, data, contentType): Promise<StorageObject> {
    const env = getEnv();
    await getClient().send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: data,
        ContentType: contentType,
      }),
    );
    return { key, size: data.length, contentType };
  },

  async get(key) {
    const env = getEnv();
    try {
      const res = await getClient().send(
        new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
      );
      if (!res.Body) return null;
      return await streamToBuffer(res.Body);
    } catch {
      return null;
    }
  },

  async delete(key) {
    const env = getEnv();
    await getClient()
      .send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }))
      .catch(() => undefined);
  },

  async exists(key) {
    return (await this.stat(key)) !== null;
  },

  async stat(key) {
    const env = getEnv();
    try {
      const res = await getClient().send(
        new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
      );
      return {
        size: res.ContentLength ?? 0,
        contentType: res.ContentType ?? guessContentType(key),
      };
    } catch {
      return null;
    }
  },

  url(key, ttlSeconds) {
    return fileUrl(key, ttlSeconds);
  },
};
