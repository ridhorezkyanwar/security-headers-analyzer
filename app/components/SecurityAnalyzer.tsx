    "use client";

    import { useState } from "react";
    import { motion, AnimatePresence } from "framer-motion";
    import {
    ShieldCheckIcon,
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon,
    ClockIcon,
    } from "@heroicons/react/24/outline";
    import { UrlInputSchema } from "@/app/lib/schemas";
    import type { AnalysisResult } from "@/app/lib/types";
    import GradeCard from "./GradeCard";
    import CheckItem from "./CheckItem";

    export default function SecurityAnalyzer() {
    const [url, setUrl] = useState("");
    const [inputError, setInputError] = useState("");
    const [data, setData] = useState<AnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ✅ Lazy initialization - load history SEKALI saat component dibuat
    const [history, setHistory] = useState<AnalysisResult[]>(() => {
        if (typeof window === "undefined") return [];
        try {
        const saved = localStorage.getItem("security-analyzer-history");
        return saved ? JSON.parse(saved) : [];
        } catch {
        return [];
        }
    });

    const analyze = async () => {
        // Validasi input
        const validation = UrlInputSchema.safeParse({ url });
        if (!validation.success) {
        setInputError(validation.error.issues[0].message);
        return;
        }

        setInputError("");
        setError(null);
        setIsLoading(true);

        try {
        const fullUrl = url.startsWith("http") ? url : `https://${url}`;
        const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: fullUrl }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Gagal menganalisis website");
        }

        const result: AnalysisResult = await res.json();
        setData(result);

        // ✅ Save ke history - pakai functional update untuk consistency
        setHistory((prev) => {
            const newHistory = [
            result,
            ...prev.filter((h) => h.url !== result.url),
            ].slice(0, 5);
            
            try {
            localStorage.setItem(
                "security-analyzer-history",
                JSON.stringify(newHistory),
            );
            } catch {
            // ignore localStorage errors
            }
            
            return newHistory;
        });
        } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan");
        } finally {
        setIsLoading(false);
        }
    };

    const downloadReport = () => {
        if (!data) return;
        const reportData = {
        tool: "Security Headers Analyzer",
        version: "1.0.0",
        author: "Ridho Rezky Anwar",
        website: "https://github.com/ridhorezkyanwar/security-headers-analyzer",
        ...data,
        };
        const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `security-report-${new URL(data.url).hostname}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <section className="min-h-screen py-24 px-6 bg-linear-to-b from-black via-gray-950 to-black">
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
            >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30 mb-4">
                <ShieldCheckIcon className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-300">Live Security Tool</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
                Security Headers{" "}
                <span className="bg-linear-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Analyzer
                </span>
            </h1>
            <p className="text-gray-400 text-lg">
                Analisis security headers website apapun secara real-time
            </p>
            </motion.div>

            {/* Input */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 mb-8"
            >
            <input
                type="text"
                value={url}
                onChange={(e) => {
                setUrl(e.target.value);
                setInputError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && analyze()}
                placeholder="Masukkan URL website (contoh: github.com)"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                disabled={isLoading}
            />
            <button
                onClick={analyze}
                disabled={isLoading || !url}
                className="px-8 py-4 bg-linear-to-r from-green-500 to-blue-500 rounded-xl font-semibold disabled:opacity-50 flex items-center gap-2 text-white hover:scale-105 transition-transform"
            >
                {isLoading ? (
                <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Analyzing...
                </>
                ) : (
                <>
                    <MagnifyingGlassIcon className="w-5 h-5" />
                    Analyze
                </>
                )}
            </button>
            </motion.div>

            {/* Error Messages */}
            <AnimatePresence>
            {(inputError || error) && (
                <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 mb-6"
                >
                ❌ {inputError || error}
                </motion.div>
            )}
            </AnimatePresence>

            {/* Results */}
            <AnimatePresence>
            {data && (
                <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
                >
                {/* Download Button */}
                <div className="flex justify-end">
                    <button
                    onClick={downloadReport}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Download Report (JSON)
                    </button>
                </div>

                <GradeCard
                    grade={data.grade}
                    score={data.score}
                    summary={data.summary}
                />

                <div className="space-y-3">
                    <h2 className="text-2xl font-bold mb-4">Detailed Analysis</h2>
                    {data.checks.map((check, i) => (
                    <CheckItem key={check.name} check={check} index={i} />
                    ))}
                </div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* History Section */}
            {history.length > 0 && (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 p-6 bg-gray-900/30 border border-gray-800 rounded-2xl"
            >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                Recent Scans
                </h2>
                <div className="space-y-2">
                {history.map((item, i) => {
                    let hostname = item.url;
                    try {
                    hostname = new URL(item.url).hostname;
                    } catch {
                    // ignore
                    }
                    return (
                    <button
                        key={i}
                        onClick={() => setUrl(hostname)}
                        className="w-full flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                        <span
                            className={`text-2xl font-bold ${
                            item.grade.startsWith("A")
                                ? "text-green-400"
                                : item.grade === "B"
                                ? "text-blue-400"
                                : item.grade === "C"
                                    ? "text-yellow-400"
                                    : "text-red-400"
                            }`}
                        >
                            {item.grade}
                        </span>
                        <span className="text-gray-300">{hostname}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                        {new Date(item.analyzedAt).toLocaleDateString()}
                        </span>
                    </button>
                    );
                })}
                </div>
            </motion.div>
            )}
        </div>
        </section>
    );
    }