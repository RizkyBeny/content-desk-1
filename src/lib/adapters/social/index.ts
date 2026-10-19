import type { ConnectionType } from "@/types";
import { getEnv } from "@/lib/env";
import type { SocialAdapter, InternalConnector } from "./types";
import { mockSocialAdapters } from "./mock";
import { makeInternalAdapter, mockInternalConnector } from "./internal-mock";

/**
 * Social adapter registry. With SOCIAL_PROVIDER=mock every platform uses the
 * deterministic mock adapter. Live implementations can be registered here
 * without touching module code (FR-CONN-1..7).
 */
export function getSocialAdapter(type: ConnectionType): SocialAdapter {
  if (type === "internal") {
    return makeInternalAdapter("mock");
  }
  const live = getEnv().SOCIAL_PROVIDER === "live";
  if (live) {
    // Live adapters are added on demand; fall back to mock until then.
    return mockSocialAdapters[type];
  }
  return mockSocialAdapters[type];
}

export function getInternalConnector(): InternalConnector {
  return mockInternalConnector;
}

export type { SocialAdapter, RawContentRecord } from "./types";
