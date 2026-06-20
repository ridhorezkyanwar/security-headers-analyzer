"use client";

import { motion } from "framer-motion";
import type { AnalysisSummary } from "@/app/lib/types";

type GradeCardProps = {
  grade: string;
  score: number;
  summary: AnalysisSummary;
};

export default function GradeCard({ grade, score, summary }: GradeCardProps) {
  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "from-green-500 to-emerald-500";
    if (grade === "B") return "from-blue-500 to-cyan-500";
    if (grade === "C") return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="p-8 bg-gray-900/50 border border-gray-800 rounded-2xl text-center backdrop-blur"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className={`inline-block text-8xl font-bold bg-gradient-to-br ${getGradeColor(grade)} bg-clip-text text-transparent mb-2`}
      >
        {grade}
      </motion.div>
      
      <div className="text-gray-400 text-lg mb-4">
        Security Score: <span className="text-white font-bold">{score}/100</span>
      </div>
      
      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.3 }}
          className={`h-full bg-gradient-to-r ${getGradeColor(grade)}`}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-3 bg-green-500/10 rounded-lg"
        >
          <div className="text-2xl font-bold text-green-400">{summary.good}</div>
          <div className="text-xs text-gray-400">Good</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-3 bg-yellow-500/10 rounded-lg"
        >
          <div className="text-2xl font-bold text-yellow-400">{summary.warning}</div>
          <div className="text-xs text-gray-400">Warning</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-3 bg-red-500/10 rounded-lg"
        >
          <div className="text-2xl font-bold text-red-400">{summary.danger}</div>
          <div className="text-xs text-gray-400">Danger</div>
        </motion.div>
      </div>
    </motion.div>
  );
}