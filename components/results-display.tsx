"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Server, Clock, DollarSign, AlertTriangle, CheckCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"

interface Alternative {
  hardware: string
  inference_time_ms: number
  cost_per_1000: number
  violates_latency: boolean
  violates_throughput: boolean
}

interface OptimizeResults {
  recommended_instance: string
  expected_inference_time_ms: number
  cost_per_1000_inferences: number
  explanation: string
  alternatives: Alternative[]
  peak_memory_usage_gb?: number // Optional for backward compatibility
}

interface ResultsProps {
  results: OptimizeResults
  isPostDeployment?: boolean
}

export default function ResultsDisplay({ results, isPostDeployment = false }: ResultsProps) {
  const [alternativesView, setAlternativesView] = useState<string>("table")

  return (
    <div className="animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
        {isPostDeployment ? "Optimization Results" : "Recommendation Results"}
      </h2>

      {/* Recommended Instance Card */}
      <Card className="shadow-xl border border-indigo-100 dark:border-indigo-900 overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 relative mb-8">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/50 dark:to-purple-950/50"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

        <CardHeader className="pb-2 border-b border-indigo-100 dark:border-indigo-900 bg-white/90 dark:bg-slate-900/90">
          <CardTitle className="text-2xl text-center text-indigo-700 dark:text-indigo-400">
            {isPostDeployment ? "Optimized Configuration" : "Recommended Configuration"}
          </CardTitle>
          {results.explanation && (
            <CardDescription className="text-center mt-2 text-slate-600 dark:text-slate-400">
              {results.explanation}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          </div>
        </CardContent>
      </Card>

      {/* Alternatives Section */}
      {results.alternatives && results.alternatives.length > 0 && (
        <Card className="shadow-xl border border-indigo-100 dark:border-indigo-900 overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 relative mt-8">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/50 dark:to-purple-950/50"></div>

          <CardHeader className="pb-2 border-b border-indigo-100 dark:border-indigo-900 bg-white/90 dark:bg-slate-900/90">
            <CardTitle className="text-xl text-indigo-700 dark:text-indigo-400">Alternative Hardware Options</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Other hardware configurations that could meet your requirements
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs value={alternativesView} onValueChange={setAlternativesView} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="cards">Card View</TabsTrigger>
              </TabsList>

              <TabsContent value="table" className="mt-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-indigo-50 dark:bg-indigo-900/30">
                        <th className="px-4 py-3 text-left text-sm font-medium text-indigo-700 dark:text-indigo-300 border-b border-indigo-100 dark:border-indigo-800">
                          Hardware
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-indigo-700 dark:text-indigo-300 border-b border-indigo-100 dark:border-indigo-800">
                          Inference Time (ms)
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-indigo-700 dark:text-indigo-300 border-b border-indigo-100 dark:border-indigo-800">
                          Cost per 1000
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-indigo-700 dark:text-indigo-300 border-b border-indigo-100 dark:border-indigo-800">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.alternatives.map((alt, index) => (
                        <tr
                          key={index}
                          className={`${
                            alt.hardware === results.recommended_instance
                              ? "bg-indigo-50 dark:bg-indigo-900/20"
                              : index % 2 === 0
                                ? "bg-white dark:bg-slate-900"
                                : "bg-indigo-50/30 dark:bg-indigo-900/10"
                          } hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors`}
                        >
                          <td className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-800 font-medium">
                            {alt.hardware === results.recommended_instance ? (
                              <div className="flex items-center">
                                {alt.hardware}
                                <span className="ml-2 text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full">
                                  Recommended
                                </span>
                              </div>
                            ) : (
                              alt.hardware
                            )}
                          </td>
                          <td className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-800">
                            {alt.inference_time_ms.toFixed(2)} ms
                          </td>
                          <td className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-800">
                            ${alt.cost_per_1000.toFixed(4)}
                          </td>
                          <td className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-800">
                            {alt.violates_latency || alt.violates_throughput ? (
                              <div className="flex items-center text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-4 w-4 mr-1" />
                                <span>
                                  {alt.violates_latency && alt.violates_throughput
                                    ? "Violates latency & throughput"
                                    : alt.violates_latency
                                      ? "Violates latency"
                                      : "Violates throughput"}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center text-green-600 dark:text-green-400">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span>Meets requirements</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="cards" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.alternatives.map((alt, index) => (
                    <Card
                      key={index}
                      className={`overflow-hidden border ${
                        alt.hardware === results.recommended_instance
                          ? "border-indigo-300 dark:border-indigo-700 shadow-md"
                          : "border-indigo-100 dark:border-indigo-900"
                      } hover:shadow-lg transition-shadow duration-200`}
                    >
                      <CardHeader
                        className={`pb-2 ${
                          alt.hardware === results.recommended_instance
                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                            : "bg-white dark:bg-slate-800"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <CardTitle
                            className={`text-lg ${
                              alt.hardware === results.recommended_instance
                                ? "text-white"
                                : "text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            {alt.hardware}
                          </CardTitle>
                          {alt.hardware === results.recommended_instance && (
                            <span className="text-xs px-2 py-0.5 bg-white/20 rounded-full">Recommended</span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Inference Time:</span>
                            <span className="font-medium">{alt.inference_time_ms.toFixed(2)} ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Cost per 1000:</span>
                            <span className="font-medium">${alt.cost_per_1000.toFixed(4)}</span>
                          </div>
                          <div className="pt-2">
                            {alt.violates_latency || alt.violates_throughput ? (
                              <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm">
                                <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span>
                                  {alt.violates_latency && alt.violates_throughput
                                    ? "Violates latency & throughput requirements"
                                    : alt.violates_latency
                                      ? "Violates latency requirement"
                                      : "Violates throughput requirement"}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                                <CheckCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span>Meets all requirements</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
