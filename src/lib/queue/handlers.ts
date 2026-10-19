import { syncAllConnections, syncConnection, refreshTrends } from "@/lib/services/sync";
import { generateItem } from "@/lib/services/creations-generate";
import { runGenerationJob } from "@/lib/services/generations";

export type JobName =
  | "sync-connection"
  | "sync-all"
  | "refresh-trends"
  | "generate-item"
  | "generate-generation";

export interface JobPayloads {
  "sync-connection": { connectionId: string };
  "sync-all": Record<string, never>;
  "refresh-trends": { region?: string };
  "generate-item": { itemId: string };
  "generate-generation": { generationId: string };
}

export async function runJob<N extends JobName>(
  name: N,
  data: JobPayloads[N],
): Promise<void> {
  switch (name) {
    case "sync-connection":
      await syncConnection((data as JobPayloads["sync-connection"]).connectionId);
      break;
    case "sync-all":
      await syncAllConnections();
      break;
    case "refresh-trends":
      await refreshTrends((data as JobPayloads["refresh-trends"]).region ?? "ID");
      break;
    case "generate-item":
      await generateItem((data as JobPayloads["generate-item"]).itemId);
      break;
    case "generate-generation":
      await runGenerationJob((data as JobPayloads["generate-generation"]).generationId);
      break;
    default:
      throw new Error(`Job tidak dikenal: ${name}`);
  }
}
