/** Small, auditable validators for the response-header checks used by the scanner. */

export function hasStrongHsts(value: string | null): boolean {
  if (!value) return false;
  const match = value.match(/(?:^|;)\s*max-age\s*=\s*(\d+)\s*(?:;|$)/i);
  return match !== null && Number(match[1]) >= 31_536_000;
}

export function isSupportedXFrameOptions(value: string | null): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "deny" || normalized === "sameorigin";
}

export function isNoSniffHeader(value: string | null): boolean {
  return value?.trim().toLowerCase() === "nosniff";
}

export function hasSafeReferrerPolicy(value: string | null): boolean {
  if (!value) return false;
  const policies = value.split(",").map((policy) => policy.trim().toLowerCase());
  const recognized = new Set([
    "no-referrer",
    "no-referrer-when-downgrade",
    "same-origin",
    "origin",
    "strict-origin",
    "origin-when-cross-origin",
    "strict-origin-when-cross-origin",
  ]);
  // unsafe-url is valid syntax but too permissive to mark as a positive security result.
  return policies.some((policy) => recognized.has(policy));
}
