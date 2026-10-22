import assert from "node:assert/strict";
import test from "node:test";
import { guardedFetch, isGuardedFetchError } from "guarded-fetch";
import { UrlInputSchema } from "../app/lib/schemas.ts";

test("accepts a bare hostname and HTTP(S) URLs", () => {
  assert.equal(UrlInputSchema.safeParse({ url: "example.com" }).success, true);
  assert.equal(
    UrlInputSchema.safeParse({ url: "https://example.com/security?check=1" }).success,
    true,
  );
  assert.equal(UrlInputSchema.safeParse({ url: "http://example.com" }).success, true);
});

test("rejects unsupported schemes and credentials embedded in a URL", () => {
  assert.equal(UrlInputSchema.safeParse({ url: "ftp://example.com/file" }).success, false);
  assert.equal(UrlInputSchema.safeParse({ url: "javascript:alert(1)" }).success, false);
  assert.equal(
    UrlInputSchema.safeParse({ url: "https://user:secret@example.com" }).success,
    false,
  );
});

test("rejects loopback, link-local metadata, and local hostnames before fetching", async (t) => {
  const targets = [
    // Loopback and local hostnames
    "http://127.0.0.1/",
    "http://[::1]/",
    "http://localhost/",
    "http://0.0.0.0/",

    // Private and link-local destinations
    "http://10.0.0.1/",
    "http://192.168.1.1/",
    "http://169.254.169.254/",
    "http://[fe80::1]/",

    // Alternate IPv4 spellings that URL parsers may normalize to loopback
    "http://2130706433/",
    "http://0177.0.0.1/",
    "http://0x7f000001/",
    "http://[::ffff:127.0.0.1]/",
  ];

  for (const target of targets) {
    await t.test(target, async () => {
      await assert.rejects(
        guardedFetch(target, { timeoutMs: 1_000, opaqueErrors: true }),
        (error) => {
          assert.equal(isGuardedFetchError(error), true);
          assert.equal(error.code, "hostname_unsafe");
          return true;
        },
      );
    });
  }
});
