import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isGateEnabled, getGateCredentials, verifyGateCredentials } from "@/lib/auth/gate";

describe("Web Login Gate Auth", () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env.GATE_ENABLED = "true";
    process.env.GATE_USER = "admin";
    process.env.GATE_PASSWORD = "contentdesk2026!";
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it("gate is enabled by default unless set to false", () => {
    expect(isGateEnabled()).toBe(true);
    process.env.GATE_ENABLED = "false";
    expect(isGateEnabled()).toBe(false);
  });

  it("reads gate credentials with correct defaults", () => {
    const creds = getGateCredentials();
    expect(creds.user).toBe("admin");
    expect(creds.pass).toBe("contentdesk2026!");
  });

  it("verifies gate credentials successfully with username or email alias", () => {
    expect(verifyGateCredentials("admin", "contentdesk2026!")).toBe(true);
    expect(verifyGateCredentials("ADMIN", "contentdesk2026!")).toBe(true);
    expect(verifyGateCredentials("admin@platform.local", "contentdesk2026!")).toBe(true);
  });

  it("rejects wrong username or wrong password", () => {
    expect(verifyGateCredentials("wronguser", "contentdesk2026!")).toBe(false);
    expect(verifyGateCredentials("admin", "wrongpassword")).toBe(false);
    expect(verifyGateCredentials("", "")).toBe(false);
  });
});
