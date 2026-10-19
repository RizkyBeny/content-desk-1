import type { ConnectionType } from "@/types";

/** Raw content record as returned by a platform adapter (pre-normalization). */
export interface RawContentRecord {
  externalId: string;
  format: string; // platform-specific format
  title: string;
  thumbnailUrl?: string | null;
  url?: string | null;
  publishedAt: string;
  reach?: number | null;
  impressions: number;
  engagement: number;
  formatMetrics: Record<string, unknown>;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  accountHandle?: string;
}

export interface SocialAdapter {
  readonly type: ConnectionType;
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<OAuthTokens>;
  /** Fetch content/metrics published at/after `since`. */
  fetchRecords(
    connection: {
      id: string;
      accessToken: string | null;
      accountHandle: string | null;
      externalRef: string | null;
    },
    since: Date,
  ): Promise<RawContentRecord[]>;
}

export interface InternalConnectorConfig {
  url: string;
  apiKey: string;
  schedule?: string;
}

/** Contract for the Internal Data Connector (FR-CONN-3). */
export interface InternalConnector {
  fetchRecords(config: InternalConnectorConfig, since: Date): Promise<RawContentRecord[]>;
}
