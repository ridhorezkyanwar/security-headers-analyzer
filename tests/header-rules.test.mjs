import assert from "node:assert/strict";
import test from "node:test";

import {
  hasSafeReferrerPolicy,
  hasStrongHsts,
  isNoSniffHeader,
  isSupportedXFrameOptions,
} from "../app/lib/header-rules.ts";

test("HSTS requires a non-trivial max-age of at least one year", () => {
  assert.equal(hasStrongHsts("max-age=31536000; includeSubDomains"), true);
  assert.equal(hasStrongHsts("max-age=63072000"), true);
  assert.equal(hasStrongHsts("max-age=0"), false);
  assert.equal(hasStrongHsts("max-age=86400"), false);
  assert.equal(hasStrongHsts("includeSubDomains"), false);
  assert.equal(hasStrongHsts(null), false);
});

test("X-Frame-Options only marks DENY and SAMEORIGIN as valid", () => {
  assert.equal(isSupportedXFrameOptions("DENY"), true);
  assert.equal(isSupportedXFrameOptions(" sameorigin "), true);
  assert.equal(isSupportedXFrameOptions("ALLOW-FROM https://example.com"), false);
  assert.equal(isSupportedXFrameOptions("invalid"), false);
  assert.equal(isSupportedXFrameOptions(null), false);
});

test("X-Content-Type-Options compares the nosniff token case-insensitively", () => {
  assert.equal(isNoSniffHeader("nosniff"), true);
  assert.equal(isNoSniffHeader("NoSniff"), true);
  assert.equal(isNoSniffHeader("nosniff; other"), false);
  assert.equal(isNoSniffHeader(null), false);
});

test("Referrer-Policy accepts recognized restrictive policies, not unsafe-url", () => {
  assert.equal(hasSafeReferrerPolicy("strict-origin-when-cross-origin"), true);
  assert.equal(hasSafeReferrerPolicy("origin, strict-origin-when-cross-origin"), true);
  assert.equal(hasSafeReferrerPolicy("unsafe-url"), false);
  assert.equal(hasSafeReferrerPolicy("unknown-policy"), false);
  assert.equal(hasSafeReferrerPolicy(null), false);
});
