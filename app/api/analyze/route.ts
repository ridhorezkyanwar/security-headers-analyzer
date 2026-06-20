import { NextRequest, NextResponse } from "next/server";
import { UrlInputSchema } from "@/app/lib/schemas";
import type { HeaderCheck, AnalysisResult } from "@/app/lib/types";

// Daftar User-Agent browser asli
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = UrlInputSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { url } = validation.data;
    const targetUrl = new URL(url.startsWith("http") ? url : `https://${url}`);

    // Pilih User-Agent acak
    const randomUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    const response = await fetch(targetUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": randomUserAgent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    const headers = response.headers;
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
    return NextResponse.json(
      { error: "Gagal menganalisis website. Website mungkin memblokir request." },
      { status: 500 }
    );
  }
}