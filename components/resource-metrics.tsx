"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RefreshCw, Edit2, Save, X } from "lucide-react"
import { FieldInfoTooltip } from "./field-info-tooltip"

// Define the types for resource metrics
interface ResourceMetrics {
  gpuUtilization: number
  gpuMemoryUsage: number
  cpuUtilization: number
  ramUsage: number
  diskIOPS: number
  networkBandwidth: number
  avgLatency: number
  throughput: number
}

interface ResourceMetricsProps {
  onMetricsChange?: (metrics: ResourceMetrics) => void
}

export function ResourceMetrics({ onMetricsChange }: ResourceMetricsProps) {
  // Default metrics - would be replaced with real-time data from backend
  const defaultMetrics: ResourceMetrics = {
    gpuUtilization: 65,
    gpuMemoryUsage: 42,
    cpuUtilization: 28,
    ramUsage: 35,
    diskIOPS: 120,
    networkBandwidth: 85,
    avgLatency: 45.3,
    throughput: 125.7,
  }

  const [metrics, setMetrics] = useState<ResourceMetrics>(defaultMetrics)
  const [editMode, setEditMode] = useState(false)
  const [editedMetrics, setEditedMetrics] = useState<ResourceMetrics>(defaultMetrics)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Tooltip content for each metric
  const tooltipContent = {
    gpuUtilization: "Percentage of GPU compute resources currently in use",
    gpuMemoryUsage: "Percentage of GPU memory currently allocated",
    cpuUtilization: "Percentage of CPU resources currently in use",
    ramUsage: "Percentage of system RAM currently in use",
    diskIOPS: "Disk I/O operations per second",
    networkBandwidth: "Network bandwidth utilization in MB/s",
    avgLatency: "Average inference latency in milliseconds",
    throughput: "Number of inferences processed per second",
  }

  // Simulate fetching metrics from backend
  const fetchMetrics = () => {
    setIsRefreshing(true)

    // Simulate API call delay
    setTimeout(() => {
      // In a real implementation, this would be an API call to get real metrics
      const newMetrics = {
        ...metrics,
        gpuUtilization: Math.floor(Math.random() * 30) + 50, // 50-80%
        gpuMemoryUsage: Math.floor(Math.random() * 40) + 30, // 30-70%
        cpuUtilization: Math.floor(Math.random() * 30) + 20, // 20-50%
        ramUsage: Math.floor(Math.random() * 20) + 30, // 30-50%
        diskIOPS: Math.floor(Math.random() * 100) + 80, // 80-180
        networkBandwidth: Math.floor(Math.random() * 50) + 60, // 60-110 MB/s
        avgLatency: (Math.round(Math.random() * 20 + 35 + Number.EPSILON) * 100) / 100, // 35-55ms
        throughput: (Math.round(Math.random() * 50 + 100 + Number.EPSILON) * 100) / 100, // 100-150/s
      }

      setMetrics(newMetrics)
      setEditedMetrics(newMetrics)
      setIsRefreshing(false)

      // Notify parent component if callback is provided
      if (onMetricsChange) {
        onMetricsChange(newMetrics)
      }
    }, 1000)
  }

  // Handle input change for edited metrics
  const handleInputChange = (metric: keyof ResourceMetrics, value: string) => {
    const numValue = Number.parseFloat(value)
    if (!isNaN(numValue)) {
      setEditedMetrics((prev) => ({
        ...prev,
        [metric]: numValue,
      }))
    }
  }

  // Save edited metrics
  const saveMetrics = () => {
    setMetrics(editedMetrics)
    setEditMode(false)

    // Notify parent component if callback is provided
    if (onMetricsChange) {
      onMetricsChange(editedMetrics)
    }
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditedMetrics(metrics)
    setEditMode(false)
  }

  // Format metric value with appropriate units
  const formatMetricValue = (key: keyof ResourceMetrics, value: number) => {
    switch (key) {
      case "gpuUtilization":
      case "gpuMemoryUsage":
      case "cpuUtilization":
      case "ramUsage":
        return `${value}%`
      case "diskIOPS":
        return `${value} IOPS`
      case "networkBandwidth":
        return `${value} MB/s`
      case "avgLatency":
        return `${value} ms`
      case "throughput":
        return `${value}/sec`
      default:
        return value.toString()
    }
  }

  // Get appropriate unit for input field
  const getMetricUnit = (key: keyof ResourceMetrics) => {
    switch (key) {
      case "gpuUtilization":
      case "gpuMemoryUsage":
      case "cpuUtilization":
      case "ramUsage":
        return "%"
      case "diskIOPS":
        return "IOPS"
      case "networkBandwidth":
        return "MB/s"
      case "avgLatency":
        return "ms"
      case "throughput":
        return "/sec"
      default:
        return ""
    }
  }

  // Simulate initial fetch on component mount
  useEffect(() => {
    fetchMetrics()
    // In a real implementation, you might set up a polling interval here
    // const interval = setInterval(fetchMetrics, 30000);
    // return () => clearInterval(interval);
  }, [])

  return (
    <Card className="shadow-xl border border-indigo-100 dark:border-indigo-900 overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 relative">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/50 dark:to-purple-950/50"></div>
      <CardHeader className="border-b border-indigo-100 dark:border-indigo-900 bg-white/90 dark:bg-slate-900/90 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl text-indigo-700 dark:text-indigo-400">Resource Metrics</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Real-time resource utilization metrics
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEdit}
                className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/50"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={saveMetrics}
                className="text-green-500 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/50"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
                className="text-indigo-500 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/50"
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Override
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMetrics}
                disabled={isRefreshing}
                className="text-indigo-500 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/50"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(metrics) as Array<keyof ResourceMetrics>).map((key) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor={key} className="text-slate-700 dark:text-slate-300 capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </Label>
                <FieldInfoTooltip content={tooltipContent[key]} />
              </div>

              {editMode ? (
                <div className="relative">
                  <Input
                    id={key}
                    type="number"
                    value={editedMetrics[key]}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500 dark:focus:ring-indigo-400 pr-12"
                    step={key === "avgLatency" || key === "throughput" ? "0.1" : "1"}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500 dark:text-slate-400">
                    {getMetricUnit(key)}
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-md font-mono text-lg">
                  {formatMetricValue(key, metrics[key])}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
