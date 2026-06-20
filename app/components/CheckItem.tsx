"use client";

import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import type { HeaderCheck } from "@/app/lib/types";

type CheckItemProps = {
  check: HeaderCheck;
  index: number;
};

export default function CheckItem({ check, index }: CheckItemProps) {
  const getIcon = (severity: HeaderCheck["severity"]) => {
    switch (severity) {
      case "good":
        return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
      case "warning":
        return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400" />;
      case "danger":
        return <XCircleIcon className="w-6 h-6 text-red-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="p-5 bg-gray-900/50 border border-gray-800 rounded-xl backdrop-blur hover:border-gray-700 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {getIcon(check.severity)}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">{check.name}</h3>
          <p className="text-gray-400 text-sm mb-2">{check.description}</p>
          {check.value && (
            <code className="block text-xs bg-black/50 p-2 rounded text-green-300 mb-2 break-all font-mono">
              {check.value}
            </code>
          )}
          <p className="text-sm text-gray-300 italic">💡 {check.recommendation}</p>
        </div>
      </div>
    </motion.div>
  );
}