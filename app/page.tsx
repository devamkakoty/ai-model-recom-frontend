"use client"

import { useState } from "react"
import OptimizerForm from "@/components/optimizer-form"
import { Toaster } from "@/components/ui/toaster"
import { BackgroundDecoration } from "@/components/background-decoration"
import { Header } from "@/components/header"
import { ResourceMetrics } from "@/components/resource-metrics"
import { DeploymentModeToggle } from "@/components/deployment-mode-toggle"

// Define the type for resource metrics
interface ResourceMetricsData {
  gpuUtilization: number
  gpuMemoryUsage: number
  cpuUtilization: number
  ramUsage: number
  diskIOPS: number
  networkBandwidth: number
  avgLatency: number
  throughput: number
}

export default function Home() {
  const [isPostDeployment, setIsPostDeployment] = useState(false)
  const [resourceMetrics, setResourceMetrics] = useState<ResourceMetricsData | null>(null)

  // Handler for when resource metrics change
  const handleMetricsChange = (metrics: ResourceMetricsData) => {
    setResourceMetrics(metrics)
  }

  return (
    <>
      <BackgroundDecoration />
      <Header />
      <main className="min-h-screen pt-16">
        <div className="container mx-auto px-4 py-12">
          <header className="mb-12 text-center relative">
            <div className="absolute inset-0 -z-10 opacity-30 dark:opacity-20">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-300 dark:bg-purple-700 rounded-full blur-3xl"></div>
              <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-blue-300 dark:bg-blue-700 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/3 right-1/3 w-56 h-56 bg-indigo-300 dark:bg-indigo-700 rounded-full blur-3xl"></div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              AI Workload Optimizer
            </h1>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-lg">
              {isPostDeployment
                ? "Optimize your running AI workloads based on actual resource utilization metrics."
                : "Find the most cost-effective hardware configuration before deploying your AI model."}
            </p>
          </header>

          <DeploymentModeToggle onChange={setIsPostDeployment} />

          {isPostDeployment && (
            <div className="mb-8">
              <ResourceMetrics onMetricsChange={handleMetricsChange} />
            </div>
          )}

          <OptimizerForm isPostDeployment={isPostDeployment} resourceMetrics={resourceMetrics} />
        </div>
        <Toaster />
      </main>
    </>
  )
}
