import { Queue, type JobsOptions } from "bullmq";
import { Redis } from "ioredis";
import { getEnv } from "@/lib/env";
import type { JobName, JobPayloads } from "./handlers";
import { runJob } from "./handlers";

const QUEUE_NAME = "ai-content-platform";

export interface EnqueueOptions {
  /** Override jumlah percobaan (default 3). Job generasi memakai 1 (FR-GEN-5). */
  attempts?: number;
}

export interface QueueDriver {
  enqueue<N extends JobName>(name: N, data: JobPayloads[N], opts?: EnqueueOptions): Promise<void>;
}

class InlineDriver implements QueueDriver {
  async enqueue<N extends JobName>(name: N, data: JobPayloads[N]): Promise<void> {
    runJob(name, data).catch((err) => {
      console.error(`[queue/inline] ${String(name)} gagal:`, err);
    });
  }
}

class RedisDriver implements QueueDriver {
  private queue: Queue | null;
  private readonly fallback = new InlineDriver();

  constructor(redisUrl: string) {
    try {
      const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
      this.queue = new Queue(QUEUE_NAME, { connection });
    } catch (err) {
      console.error("[queue/redis] inisialisasi gagal, fallback inline:", err);
      this.queue = null;
    }
  }

  async enqueue<N extends JobName>(name: N, data: JobPayloads[N], opts?: EnqueueOptions): Promise<void> {
    if (!this.queue) {
      return this.fallback.enqueue(name, data);
    }
    const jobOpts: JobsOptions = {
      attempts: opts?.attempts ?? 3,
      backoff: { type: "exponential", delay: 2000 },
    };
    await this.queue.add(name, data, jobOpts);
  }
}

let cached: QueueDriver | null = null;

export function getQueueDriver(): QueueDriver {
  if (cached) return cached;
  const env = getEnv();
  cached =
    env.QUEUE_DRIVER === "redis" && env.REDIS_URL
      ? new RedisDriver(env.REDIS_URL)
      : new InlineDriver();
  return cached;
}

export function enqueueJob<N extends JobName>(
  name: N,
  data: JobPayloads[N],
  opts?: EnqueueOptions,
): Promise<void> {
  return getQueueDriver().enqueue(name, data, opts);
}
