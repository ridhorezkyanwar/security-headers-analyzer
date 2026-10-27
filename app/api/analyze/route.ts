import { NextRequest, NextResponse } from "next/server";
import { guardedFetch, isGuardedFetchError } from "guarded-fetch";
import { MAX_REQUEST_BYTES, UrlInputSchema } from "@/app/lib/schemas";
import { readBoundedBody } from "@/app/lib/bounded-body";
import {
  hasSafeReferrerPolicy,
  hasStrongHsts,
  isNoSniffHeader,
  isSupportedXFrameOptions,
} from "@/app/lib/header-rules";
import type { HeaderCheck, AnalysisResult } from "@/app/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength !== null) {
      const requestBytes = Number(contentLength);
      if (Number.isFinite(requestBytes) && requestBytes > MAX_REQUEST_BYTES) {
        return NextResponse.json(
          { error: "Ukuran request maksimal 4 KB." },
          { status: 413 }
        );
      }
    }

    const boundedBody = await readBoundedBody(req, MAX_REQUEST_BYTES);
    if (!boundedBody.ok) {
      if (boundedBody.reason === "too-large") {
        return NextResponse.json(
          { error: "Ukuran request maksimal 4 KB." },
          { status: 413 }
        );
      }
      return NextResponse.json(
        { error: boundedBody.reason === "invalid-utf8"
          ? "Body request harus menggunakan UTF-8 yang valid."
          : "Body request tidak dapat dibaca." },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(boundedBody.text);
    } catch {
      return NextResponse.json(
        { error: "Body request harus berupa JSON yang valid." },
        { status: 400 }
      );
    }

    const validation = UrlInputSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { url } = validation.data;
    const trimmedUrl = url.trim();
    const targetUrl = new URL(
      /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`,
    );

    // guardedFetch validates DNS destinations at connect time and revalidates every redirect.
    // This scanner needs only response headers, so cancel the response body immediately.
    const response = await guardedFetch(targetUrl, {
      method: "GET",
      timeoutMs: 8_000,
      maxRedirects: 3,
      opaqueErrors: true,
      headers: {
        "User-Agent": "SecurityHeadersAnalyzer/1.0 (+https://github.com/ridhorezkyanwar/security-headers-analyzer)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    const headers = response.headers;
    try {
      await response.body?.cancel();
    } catch {
      // The scan depends on response headers only; body cancellation is best-effort.
    }
    const checks: HeaderCheck[] = [];

    // CHECK 1: HSTS — require a meaningful max-age, not mere presence.
    const hsts = headers.get("strict-transport-security");
    const hstsValid = hasStrongHsts(hsts);
    checks.push({
      name: "Strict-Transport-Security (HSTS)",
      present: !!hsts,
      value: hsts,
      severity: hstsValid ? "good" : hsts ? "warning" : "danger",
      description: "Memeriksa keberadaan HSTS dan max-age minimal satu tahun.",
      recommendation: hstsValid
        ? "✅ max-age HSTS minimal satu tahun terdeteksi; tinjau cakupan subdomain secara terpisah."
        : hsts
          ? "Header ada, tetapi max-age harus valid dan minimal 31536000 detik."
          : "Tambahkan header: Strict-Transport-Security: max-age=31536000; includeSubDomains",
    });

    // CHECK 2: CSP — presence alone does not prove the directives are safe.
    const csp = headers.get("content-security-policy");
    const cspPresent = !!csp?.trim();
    checks.push({
      name: "Content-Security-Policy (CSP)",
      present: cspPresent,
      value: csp,
      severity: cspPresent ? "warning" : "danger",
      description: "Keberadaan CSP diperiksa; kualitas directive belum dianalisis.",
      recommendation: cspPresent
        ? "Header ada, tetapi audit directive secara terpisah; keberadaan CSP saja tidak membuktikan kebijakan aman."
        : "Tambahkan Content-Security-Policy dengan directive spesifik dan hindari wildcard/unsafe-inline jika tidak diperlukan.",
    });

    // CHECK 3: X-Frame-Options — accept only recognized defensive values.
    const xfo = headers.get("x-frame-options");
    const xfoValid = isSupportedXFrameOptions(xfo);
    checks.push({
      name: "X-Frame-Options",
      present: !!xfo,
      value: xfo,
      severity: xfoValid ? "good" : "warning",
      description: "Memeriksa nilai DENY atau SAMEORIGIN; CSP frame-ancestors juga relevan.",
      recommendation: xfoValid
        ? "✅ Nilai X-Frame-Options dikenali."
        : "Gunakan DENY atau SAMEORIGIN, atau audit CSP frame-ancestors sebagai kontrol modern.",
    });

    // CHECK 4: X-Content-Type-Options — compare the nosniff token safely.
    const xcto = headers.get("x-content-type-options");
    const xctoValid = isNoSniffHeader(xcto);
    checks.push({
      name: "X-Content-Type-Options",
      present: !!xcto,
      value: xcto,
      severity: xctoValid ? "good" : "warning",
      description: "Mencegah browser melakukan MIME-type sniffing.",
      recommendation: xctoValid
        ? "✅ MIME sniffing protection aktif."
        : "Tambahkan nilai header X-Content-Type-Options: nosniff.",
    });

    // CHECK 5: Referrer-Policy — do not mark unsafe-url as a positive result.
    const rp = headers.get("referrer-policy");
    const rpValid = hasSafeReferrerPolicy(rp);
    checks.push({
      name: "Referrer-Policy",
      present: !!rp,
      value: rp,
      severity: rpValid ? "good" : "warning",
      description: "Memeriksa kebijakan referrer yang dikenal dan tidak memakai unsafe-url.",
      recommendation: rpValid
        ? "✅ Nilai Referrer-Policy dikenali."
        : "Pertimbangkan strict-origin-when-cross-origin, same-origin, atau no-referrer.",
    });

    // CHECK 6: Presence is not enough to validate the Permissions-Policy allowlist.
    const pp = headers.get("permissions-policy");
    const ppPresent = !!pp?.trim();
    checks.push({
      name: "Permissions-Policy",
      present: ppPresent,
      value: pp,
      severity: "warning",
      description: "Keberadaan header diperiksa; allowlist tiap fitur belum divalidasi.",
      recommendation: ppPresent
        ? "Header ada; audit allowlist kamera, mikrofon, geolokasi, dan fitur sensitif."
        : "Tambahkan Permissions-Policy yang membatasi fitur sensitif sesuai kebutuhan aplikasi.",
    });

    // CHECK 7: HTTPS
    const isHttps = targetUrl.protocol === "https:";
    checks.push({
      name: "HTTPS",
      present: isHttps,
      value: targetUrl.protocol,
      severity: isHttps ? "good" : "danger",
      description: "Koneksi terenkripsi antara browser dan server.",
      recommendation: isHttps
        ? "✅ Menggunakan HTTPS."
        : "WAJIB migrate ke HTTPS!",
    });

    // DETEKSI ANTI-BOT PROTECTION
    const serverHeader = headers.get("server") || "";
    const cfRay = headers.get("cf-ray");
    const xAmzCfId = headers.get("x-amz-cf-id");
    const akamaiGru = headers.get("x-akamai-transformed");

    let botProtection: string | null = null;
    if (cfRay) botProtection = "Cloudflare";
    else if (xAmzCfId) botProtection = "AWS CloudFront";
    else if (akamaiGru) botProtection = "Akamai";
    else if (serverHeader.toLowerCase().includes("cloudflare")) botProtection = "Cloudflare";
    else if (serverHeader.toLowerCase().includes("akamai")) botProtection = "Akamai";

    // CDN/anti-bot detection is context only; it must not lower the header score.

    // Hitung skor & grade
    const goodCount = checks.filter((c) => c.severity === "good").length;
    const warningCount = checks.filter((c) => c.severity === "warning").length;
    const dangerCount = checks.filter((c) => c.severity === "danger").length;
    const score = Math.round((goodCount / checks.length) * 100);

    const grade =
      score >= 95 ? "A+" :
      score >= 85 ? "A" :
      score >= 75 ? "B" :
      score >= 65 ? "C" :
      score >= 50 ? "D" : "F";

    const result: AnalysisResult = {
      url: targetUrl.href,
      grade,
      score,
      summary: {
        good: goodCount,
        warning: warningCount,
        danger: dangerCount,
        total: checks.length,
      },
      checks,
      botProtection,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("Analysis error:", error);

    if (isGuardedFetchError(error)) {
      const rejectedTargetCodes = new Set([
        "invalid_url",
        "protocol_not_allowed",
        "hostname_unsafe",
        "host_not_allowed",
        "redirect_invalid",
        "redirect_to_unsafe_host",
        "too_many_redirects",
      ]);
      const status = rejectedTargetCodes.has(error.code)
        ? 400
        : error.code === "timeout"
          ? 504
          : 502;

      return NextResponse.json(
        { error: "Target ditolak atau tidak dapat dianalisis. Gunakan URL publik yang dapat diakses." },
        { status }
      );
    }

    return NextResponse.json(
      { error: "Gagal menganalisis website karena kesalahan internal." },
      { status: 500 }
    );
  }
}