/**
 * HTTP Basic Auth — gerbang tambahan di depan login aplikasi.
 *
 * Berbeda dengan session cookie (`acp_session`) yang mengurus "siapa" user,
 * Basic Auth di sini hanya menjaga "boleh-tidaknya" sebuah deployment diakses
 * sama sekali (use case utama: preview/staging yang datanya mock).
 *
 * Kredensial dibaca dari env:
 *   BASIC_AUTH_USER       — username (wajib kalau fitur dinyalakan)
 *   BASIC_AUTH_PASSWORD   — password (wajib kalau fitur dinyalakan)
 *
 * Fitur aktif hanya jika kedua env terisi non-kosong. Kalau keduanya kosong,
 * semua request lewat tanpa challenge (perilaku default, aman untuk lokal).
 *
 * Modul ini murni JS tanpa `node:crypto` supaya aman dipakai di proxy,
 * yang bisa berjalan di runtime non-Node.
 */

export interface BasicAuthResult {
  ok: boolean;
  /** True kalau fitur basic auth memang aktif (kredensial terisi). */
  enabled: boolean;
}

/** Perbandingan waktu-konstan untuk mencegah timing attack. */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length, 1);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** Ambil kredensial dari header `Authorization: Basic base64(user:pass)`. */
export function parseBasicHeader(header: string | null): { user: string; pass: string } | null {
  if (!header) return null;
  const [scheme, encoded] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "basic" || !encoded) return null;
  let decoded: string;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return null;
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) return null;
  return { user: decoded.slice(0, sep), pass: decoded.slice(sep + 1) };
}

/** Kredensial yang diharapkan, atau null kalau basic auth tidak dikonfigurasi. */
export function basicCredentials(): { user: string; pass: string } | null {
  const user = process.env.BASIC_AUTH_USER?.trim();
  const pass = process.env.BASIC_AUTH_PASSWORD;
  if (!user || !pass) return null;
  return { user, pass };
}

export function basicAuthEnabled(): boolean {
  return basicCredentials() !== null;
}

/** Validasi header Authorization terhadap kredensial env. */
export function verifyBasicAuth(header: string | null): BasicAuthResult {
  const expected = basicCredentials();
  if (!expected) return { ok: true, enabled: false };

  const parsed = parseBasicHeader(header);
  if (!parsed) return { ok: false, enabled: true };

  const ok =
    timingSafeEqualStr(parsed.user, expected.user) &&
    timingSafeEqualStr(parsed.pass, expected.pass);
  return { ok, enabled: true };
}

/** Header `WWW-Authenticate` yang memicu prompt login browser. */
export const BASIC_AUTH_CHALLENGE = 'Basic realm="Content Desk", charset="UTF-8"';

/**
 * Path yang tidak perlu di-challenge: aset build Next.js, icon bawaan, dan
 * berkas statis di /public. Tanpa pengecualian ini, prompt browser bisa
 * muncul berulang kali saat memuat aset.
 */
const EXEMPT_PREFIXES = [
  "/_next/",
  "/favicon.ico",
  "/icon.png",
  "/apple-icon.png",
  "/robots.txt",
];

export function isBasicAuthExempt(pathname: string): boolean {
  return EXEMPT_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}
