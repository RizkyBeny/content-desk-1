import type { RawContentRecord, SocialAdapter, InternalConnector } from "./types";
import { generateMockRecords } from "./mock";

/** Mock internal connector — generates article-shaped records. */
export const mockInternalConnector: InternalConnector = {
  async fetchRecords(config, since) {
    const seed = config.url || "internal";
    return generateMockRecords("internal", seed, since, 16);
  },
};

/** The internal source is treated as a SocialAdapter for uniform sync handling. */
export function makeInternalAdapter(mode: "mock" | "live"): SocialAdapter {
  void mode;
  return {
    type: "internal",
    getAuthUrl: () => "/pengaturan/koneksi",
    exchangeCode: async () => ({ accessToken: "internal" }),
    async fetchRecords(connection, since): Promise<RawContentRecord[]> {
      return mockInternalConnector.fetchRecords(
        { url: connection.externalRef ?? "internal", apiKey: "" },
        since,
      );
    },
  };
}
