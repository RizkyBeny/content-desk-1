import { timingSafeEqualStr } from "./basic";

export interface GateCredentials {
  user: string;
  pass: string;
}

const DEFAULT_GATE_USER = "admin";
const DEFAULT_GATE_PASSWORD = "contentdesk2026!";

/**
 * Memeriksa apakah Web Login Gate aktif.
 * Default aktif (true) kecuali jika GATE_ENABLED diset eksplisit ke "false".
 */
export function isGateEnabled(): boolean {
  return process.env.GATE_ENABLED !== "false";
}

/**
 * Mengambil kredensial login gate dari environment dengan fallback default.
 */
export function getGateCredentials(): GateCredentials {
  const user = process.env.GATE_USER?.trim() || DEFAULT_GATE_USER;
  const pass = process.env.GATE_PASSWORD || DEFAULT_GATE_PASSWORD;
  return { user, pass };
}

/**
 * Validasi username/email dan password terhadap kredensial login gate.
 * Mendukung username alias `admin`, kredensial GATE_USER, atau email `admin@platform.local`.
 */
export function verifyGateCredentials(identifier: string, pass: string): boolean {
  if (!identifier || !pass) return false;
  const creds = getGateCredentials();
  const normalizedInput = identifier.toLowerCase().trim();
  const normalizedExpected = creds.user.toLowerCase().trim();

  const isUserMatch =
    normalizedInput === normalizedExpected ||
    (normalizedExpected === "admin" && normalizedInput === "admin@platform.local") ||
    normalizedInput === `${normalizedExpected}@platform.local`;

  if (!isUserMatch) return false;
  return timingSafeEqualStr(pass, creds.pass);
}
