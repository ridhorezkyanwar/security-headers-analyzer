import { NextRequest, NextResponse } from "next/server";
import { guardedFetch, isGuardedFetchError } from "guarded-fetch";
import { MAX_REQUEST_BYTES, UrlInputSchema } from "@/app/lib/schemas";
import { readBoundedBody } from "@/app/lib/bounded-body";
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

    // CHECK 1: HSTS
    const hsts = headers.get("strict-transport-security");
    checks.push({
      name: "Strict-Transport-Security (HSTS)",
      present: !!hsts,
      value: hsts,
      severity: hsts ? "good" : "danger",
      description: "Memaksa browser menggunakan HTTPS untuk semua koneksi",
      recommendation: hsts
        ? "✅ Implementasi HSTS yang baik"
        : "Tambahkan header: Strict-Transport-Security: max-age=31536000; includeSubDomains",
    });

    // CHECK 2: CSP
    const csp = headers.get("content-security-policy");
    checks.push({
      name: "Content-Security-Policy (CSP)",
      present: !!csp,
      value: csp,
      severity: csp ? "good" : "danger",
      description: "Mencegah serangan XSS dan injection",
      recommendation: csp
        ? "✅ CSP sudah dikonfigurasi"
        : "Implementasi CSP untuk membatasi resource yang bisa di-load",
    });

    // CHECK 3: X-Frame-Options
    const xfo = headers.get("x-frame-options");
    checks.push({
      name: "X-Frame-Options",
      present: !!xfo,
      value: xfo,
      severity: xfo ? "good" : "warning",
      description: "Mencegah serangan clickjacking",
      recommendation: xfo
        ? "✅ Terlindungi dari clickjacking"
        : "Tambahkan: X-Frame-Options: DENY atau SAMEORIGIN",
    });

    // CHECK 4: X-Content-Type-Options
    const xcto = headers.get("x-content-type-options");
    checks.push({
      name: "X-Content-Type-Options",
      present: xcto === "nosniff",
      value: xcto,
      severity: xcto === "nosniff" ? "good" : "warning",
      description: "Mencegah browser melakukan MIME-type sniffing",
      recommendation: xcto === "nosniff"
        ? "✅ MIME sniffing protection aktif"
        : "Tambahkan: X-Content-Type-Options: nosniff",
    });

    // CHECK 5: Referrer-Policy
    const rp = headers.get("referrer-policy");
    checks.push({
      name: "Referrer-Policy",
      present: !!rp,
      value: rp,
      severity: rp ? "good" : "warning",
      description: "Mengontrol informasi referrer yang dikirim ke website lain",
      recommendation: rp
        ? "✅ Referrer policy sudah dikonfigurasi"
        : "Tambahkan: Referrer-Policy: strict-origin-when-cross-origin",
    });

    // CHECK 6: Permissions-Policy
    const pp = headers.get("permissions-policy");
    checks.push({
      name: "Permissions-Policy",
      present: !!pp,
      value: pp,
      severity: pp ? "good" : "warning",
      description: "Mengontrol fitur browser yang bisa dipakai (kamera, mic, dll)",
      recommendation: pp
        ? "✅ Permissions sudah dibatasi"
        : "Batasi akses ke fitur browser sensitif",
    });

    // CHECK 7: HTTPS
    const isHttps = targetUrl.protocol === "https:";
    checks.push({
      name: "HTTPS",
      present: isHttps,
      value: targetUrl.protocol,
      severity: isHttps ? "good" : "danger",
      description: "Koneksi terenkripsi antara browser dan server",
      recommendation: isHttps
        ? "✅ Menggunakan HTTPS"
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

    if (botProtection) {
      checks.push({
        name: "Anti-Bot Protection Detected",
        present: true,
        value: botProtection,
        severity: "warning",
        description: `Website ini dilindungi oleh ${botProtection}. Beberapa security headers mungkin disembunyikan.`,
        recommendation: `Hasil analisis mungkin tidak 100% akurat karena ${botProtection} sering menyembunyikan headers dari bot. Ini BUKAN berarti website tidak aman!`,
      });
    }

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