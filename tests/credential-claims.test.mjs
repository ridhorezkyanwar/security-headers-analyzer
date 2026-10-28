import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const publicClaimPatterns = [
  /AWS Certified Machine Learning Engineer/i,
  /AWS Certified ML Engineer/i,
];

for (const file of ["../app/layout.tsx", "../app/components/Footer.tsx"]) {
  test(`public identity copy in ${file} does not claim an unearned AWS certification`, async () => {
    const content = await readFile(new URL(file, import.meta.url), "utf8");
    for (const pattern of publicClaimPatterns) {
      assert.doesNotMatch(content, pattern, `Unsupported credential claim remains in ${file}: ${pattern}`);
    }
  });
}
