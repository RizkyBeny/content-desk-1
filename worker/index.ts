import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { getEnv } from "@/lib/env";
import { runJob, type JobName, type JobPayloads } from "../src/lib/queue/handlers";

const QUEUE_NAME = "ai-content-platform";
const env = getEnv();
const redisUrl = env.REDIS_URL;

async function registerRepeatableJobs(queue: Queue) {
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    await queue.removeRepeatableByKey(job.key);
  }
  await queue.add(
    "sync-all",
    {},
    { repeat: { pattern: "0 */6 * * *" }, jobId: "repeat:sync-all" },
  );
  await queue.add(
    "refresh-trends",
    { region: "ID" },
    { repeat: { pattern: "0 */3 * * *" }, jobId: "repeat:refresh-trends" },
  );
  console.info("[worker] repeatable jobs terdaftar: sync-all (6 jam), refresh-trends (3 jam)");
}

if (redisUrl && env.QUEUE_DRIVER === "redis") {
  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const queue = new Queue(QUEUE_NAME, { connection });
  const worker = new Worker<JobName>(
    QUEUE_NAME,
    async (job) => {
      await runJob(job.name as JobName, job.data as JobPayloads[JobName]);
    },
    { connection, concurrency: 3 },
  );

  worker.on("failed", (job, err) => {
    console.error(`[worker] job ${job?.name} gagal:`, err);
  });
  worker.on("error", (err) => console.error("[worker] error:", err));
  worker.on("completed", (job) => {
    console.info(`[worker] job ${job.name} completed`);
  });

  registerRepeatableJobs(queue).catch((err) =>
    console.error("[worker] gagal mendaftarkan repeatable jobs:", err),
  );

  const shutdown = async () => {
    console.info("[worker] mematikan...");
    await worker.close();
    await queue.close();
    await connection.quit();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
} else {
  console.info("[worker] QUEUE_DRIVER=inline — worker tidak dipakai, jobs berjalan inline.");
}
