export type Severity = "good" | "warning" | "danger";

export type HeaderCheck = {
  name: string;
  present: boolean;
  value: string | null;
  severity: Severity;
  description: string;
  recommendation: string;
};

export type AnalysisSummary = {
  good: number;
  warning: number;
  danger: number;
  total: number;
};

export type AnalysisResult = {
  url: string;
  grade: string;
  score: number;
  summary: AnalysisSummary;
  checks: HeaderCheck[];
  botProtection?: string | null;
  analyzedAt: string;
};