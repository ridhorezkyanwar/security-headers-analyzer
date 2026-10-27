import assert from "node:assert/strict";
import test from "node:test";

import { readBoundedBody } from "../app/lib/bounded-body.ts";

test("reads a valid JSON request within the byte budget", async () => {
  const request = new Request("https://example.test/api/analyze", {
    method: "POST",
    body: JSON.stringify({ url: "https://example.com" }),
  });
  assert.deepEqual(await readBoundedBody(request, 4096), {
    ok: true,
    text: JSON.stringify({ url: "https://example.com" }),
  });
});

test("rejects an oversized stream without Content-Length", async () => {
  const request = new Request("https://example.test/api/analyze", {
    method: "POST",
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("x".repeat(5000)));
        controller.close();
      },
    }),
    duplex: "half",
  });
  assert.equal(request.headers.get("content-length"), null);
  assert.deepEqual(await readBoundedBody(request, 4096), {
    ok: false,
    reason: "too-large",
  });
});

test("rejects invalid UTF-8", async () => {
  const request = new Request("https://example.test/api/analyze", {
    method: "POST",
    body: new Uint8Array([0xff, 0xfe]),
  });
  assert.deepEqual(await readBoundedBody(request, 4096), {
    ok: false,
    reason: "invalid-utf8",
  });
});
