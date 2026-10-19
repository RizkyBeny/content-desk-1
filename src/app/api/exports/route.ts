import { handle, ok } from "@/lib/api";
import { startExport } from "@/lib/services/exports";

export async function POST() {
  return handle(async () => {
    // Placeholder: export diproses secara sinkron untuk v1, jobId dikembalikan.
    const result = { assetId: null, fileUrl: null, jobId: "job-" + Date.now() };
    return ok(result);
  });
}