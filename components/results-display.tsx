"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Server, Clock, DollarSign, MemoryStickIcon as Memory } from "lucide-react"

interface ResultsProps {
  results: {
    recommended_instance: string
    expected_inference_time_ms: number
    cost_per_1000_inferences: number
    peak_memory_usage_gb: number
  }
  isPostDeployment?: boolean
}

export default function ResultsDisplay({ results, isPostDeployment = false }: ResultsProps) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
        {isPostDeployment ? "Optimization Results" : "Recommendation Results"}
      </h2>

      <Card className="shadow-xl border border-indigo-100 dark:border-indigo-900 overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 relative">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/50 dark:to-purple-950/50"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

        <CardHeader className="pb-2 border-b border-indigo-100 dark:border-indigo-900 bg-white/90 dark:bg-slate-900/90">
          <CardTitle className="text-2xl text-center text-indigo-700 dark:text-indigo-400">
            {isPostDeployment ? "Optimized Configuration" : "Recommended Configuration"}
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center p-6 bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-indigo-950/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-indigo-100 dark:border-indigo-900">
              <div className="mr-5 bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-xl shadow-md">
                <Server className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {isPostDeployment ? "Optimized Instance" : "Recommended Instance"}
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                  {results.recommended_instance}
                </p>
              </div>
            </div>

            <div className="flex items-center p-6 bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-blue-950/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-blue-100 dark:border-blue-900">
              <div className="mr-5 bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-md">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Expected Inference Time
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                  {results.expected_inference_time_ms.toFixed(2)} ms
                </p>
              </div>
            </div>

            <div className="flex items-center p-6 bg-gradient-to-br from-white to-amber-50 dark:from-slate-800 dark:to-amber-950/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-amber-100 dark:border-amber-900">
              <div className="mr-5 bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-xl shadow-md">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Cost Per 1000 Inferences
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                  ${results.cost_per_1000_inferences.toFixed(4)}
                </p>
              </div>
            </div>

            <div className="flex items-center p-6 bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-purple-950/30 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-purple-100 dark:border-purple-900">
              <div className="mr-5 bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-xl shadow-md">
                <Memory className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  Peak Memory Usage
                </p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-1">
                  {results.peak_memory_usage_gb.toFixed(2)} GB
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
