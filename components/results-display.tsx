"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Server,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  Cpu,
  Zap,
  HardDrive,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import jsPDF from "jspdf"

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

// Hardware specifications database
const hardwareSpecs = {
  A100: {
    fullName: "NVIDIA A100 Tensor Core GPU",
    memory: "40GB HBM2e",
    tensorCores: "432 Tensor Cores (3rd gen)",
    fp16Performance: "312 TFLOPS",
    fp32Performance: "19.5 TFLOPS",
    memoryBandwidth: "1,555 GB/s",
    powerConsumption: "400W",
    architecture: "Ampere",
    useCase: "High-performance training and inference for large models",
    strengths: ["Exceptional performance for large models", "High memory capacity", "Advanced Tensor Cores"],
    considerations: ["Higher cost", "High power consumption"],
  },
  H100: {
    fullName: "NVIDIA H100 Tensor Core GPU",
    memory: "80GB HBM3",
    tensorCores: "528 Tensor Cores (4th gen)",
    fp16Performance: "989 TFLOPS",
    fp32Performance: "67 TFLOPS",
    memoryBandwidth: "3,350 GB/s",
    powerConsumption: "700W",
    architecture: "Hopper",
    useCase: "Next-generation AI training and inference",
    strengths: ["Cutting-edge performance", "Massive memory capacity", "Latest architecture"],
    considerations: ["Premium pricing", "Very high power consumption"],
  },
  A10: {
    fullName: "NVIDIA A10 GPU",
    memory: "24GB GDDR6",
    tensorCores: "192 Tensor Cores (3rd gen)",
    fp16Performance: "125 TFLOPS",
    fp32Performance: "31.2 TFLOPS",
    memoryBandwidth: "600 GB/s",
    powerConsumption: "150W",
    architecture: "Ampere",
    useCase: "Balanced performance for inference and light training",
    strengths: ["Good price-performance ratio", "Moderate power consumption", "Versatile"],
    considerations: ["Lower memory than A100", "Less suitable for very large models"],
  },
  A10g: {
    fullName: "NVIDIA A10G GPU",
    memory: "24GB GDDR6",
    tensorCores: "192 Tensor Cores (3rd gen)",
    fp16Performance: "125 TFLOPS",
    fp32Performance: "31.2 TFLOPS",
    memoryBandwidth: "600 GB/s",
    powerConsumption: "300W",
    architecture: "Ampere",
    useCase: "Cloud-optimized inference and training",
    strengths: ["Cloud-optimized design", "Good memory capacity", "Efficient for inference"],
    considerations: ["Higher power than A10", "Cloud-specific optimization"],
  },
  T4: {
    fullName: "NVIDIA Tesla T4 GPU",
    memory: "16GB GDDR6",
    tensorCores: "320 Tensor Cores (2nd gen)",
    fp16Performance: "65 TFLOPS",
    fp32Performance: "8.1 TFLOPS",
    memoryBandwidth: "300 GB/s",
    powerConsumption: "70W",
    architecture: "Turing",
    useCase: "Cost-effective inference for smaller models",
    strengths: ["Very low power consumption", "Cost-effective", "Good for inference"],
    considerations: ["Limited memory", "Older architecture", "Lower performance"],
  },
  RTX_3070: {
    fullName: "NVIDIA GeForce RTX 3070",
    memory: "8GB GDDR6",
    tensorCores: "184 Tensor Cores (2nd gen)",
    fp16Performance: "40 TFLOPS",
    fp32Performance: "20.3 TFLOPS",
    memoryBandwidth: "448 GB/s",
    powerConsumption: "220W",
    architecture: "Ampere",
    useCase: "Development and small-scale inference",
    strengths: ["Consumer-grade pricing", "Good for development", "Widely available"],
    considerations: ["Limited memory", "Not optimized for enterprise", "Gaming-focused"],
  },
  RTX_A5000: {
    fullName: "NVIDIA RTX A5000",
    memory: "24GB GDDR6",
    tensorCores: "256 Tensor Cores (2nd gen)",
    fp16Performance: "67 TFLOPS",
    fp32Performance: "27.8 TFLOPS",
    memoryBandwidth: "768 GB/s",
    powerConsumption: "230W",
    architecture: "Ampere",
    useCase: "Professional workstation AI workloads",
    strengths: ["Professional drivers", "Good memory capacity", "Workstation reliability"],
    considerations: ["Higher cost than consumer GPUs", "Lower performance than datacenter GPUs"],
  },
  CPU: {
    fullName: "CPU-only Processing",
    memory: "System RAM dependent",
    tensorCores: "N/A",
    fp16Performance: "Varies by CPU",
    fp32Performance: "Varies by CPU",
    memoryBandwidth: "System dependent",
    powerConsumption: "65-280W",
    architecture: "x86/ARM",
    useCase: "Small models, development, or GPU-unavailable scenarios",
    strengths: ["No GPU required", "Lower cost", "High memory capacity potential"],
    considerations: ["Much slower inference", "No tensor acceleration", "Limited parallelism"],
  },
}

export default function ResultsDisplay({ results, isPostDeployment = false }: ResultsProps) {
  const [alternativesView, setAlternativesView] = useState<string>("table")

  const getHardwareSpecs = (hardwareName: string) => {
    return hardwareSpecs[hardwareName as keyof typeof hardwareSpecs] || null
  }

  const generateReportData = () => {
    const timestamp = new Date().toISOString()
    const recommendedSpecs = getHardwareSpecs(results.recommended_instance)

    return {
      reportMetadata: {
        generatedAt: timestamp,
        reportType: isPostDeployment ? "Hardware Optimization Report" : "Hardware Recommendation Report",
        analysisMode: isPostDeployment ? "Post-Deployment Analysis" : "Pre-Deployment Planning",
      },
      recommendation: {
        primaryRecommendation: results.recommended_instance,
        expectedInferenceTime: results.expected_inference_time_ms,
        costPer1000Inferences: results.cost_per_1000_inferences,
        explanation: results.explanation,
        peakMemoryUsage: results.peak_memory_usage_gb,
      },
      hardwareAnalysis: recommendedSpecs
        ? {
            detectedHardware: recommendedSpecs.fullName,
            specifications: {
              memory: recommendedSpecs.memory,
              tensorCores: recommendedSpecs.tensorCores,
              fp16Performance: recommendedSpecs.fp16Performance,
              fp32Performance: recommendedSpecs.fp32Performance,
              memoryBandwidth: recommendedSpecs.memoryBandwidth,
              powerConsumption: recommendedSpecs.powerConsumption,
              architecture: recommendedSpecs.architecture,
            },
            insights: {
              useCase: recommendedSpecs.useCase,
              strengths: recommendedSpecs.strengths,
              considerations: recommendedSpecs.considerations,
            },
          }
        : null,
      alternatives:
        results.alternatives?.map((alt) => ({
          hardware: alt.hardware,
          specs: getHardwareSpecs(alt.hardware),
          performance: {
            inferenceTime: alt.inference_time_ms,
            costPer1000: alt.cost_per_1000,
            violatesLatency: alt.violates_latency,
            violatesThroughput: alt.violates_throughput,
          },
        })) || [],
    }
  }

  const downloadReport = (format: "json" | "csv" | "pdf") => {
    const reportData = generateReportData()
    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `${isPostDeployment ? "optimization" : "recommendation"}_report_${timestamp}`

    if (format === "json") {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${filename}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === "csv") {
      let csvContent =
        "Hardware,Inference Time (ms),Cost per 1000,Violates Latency,Violates Throughput,Full Name,Memory,Architecture\n"

      // Add recommended instance
      const recommendedSpecs = getHardwareSpecs(results.recommended_instance)
      csvContent += `${results.recommended_instance} (Recommended),${results.expected_inference_time_ms},${results.cost_per_1000_inferences},false,false,"${recommendedSpecs?.fullName || "N/A"}","${recommendedSpecs?.memory || "N/A"}","${recommendedSpecs?.architecture || "N/A"}"\n`

      // Add alternatives
      results.alternatives?.forEach((alt) => {
        const specs = getHardwareSpecs(alt.hardware)
        csvContent += `${alt.hardware},${alt.inference_time_ms},${alt.cost_per_1000},${alt.violates_latency},${alt.violates_throughput},"${specs?.fullName || "N/A"}","${specs?.memory || "N/A"}","${specs?.architecture || "N/A"}"\n`
      })

      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${filename}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === "pdf") {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 20
      let yPosition = margin

      // Helper function to add text with word wrapping
      const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
        doc.setFontSize(fontSize)
        const lines = doc.splitTextToSize(text, maxWidth)
        doc.text(lines, x, y)
        return y + lines.length * fontSize * 0.4
      }

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage()
          yPosition = margin
        }
      }

      // Title
      doc.setFontSize(20)
      doc.setFont(undefined, "bold")
      doc.text(reportData.reportMetadata.reportType, margin, yPosition)
      yPosition += 15

      // Metadata
      doc.setFontSize(10)
      doc.setFont(undefined, "normal")
      yPosition = addText(
        `Generated: ${new Date(reportData.reportMetadata.generatedAt).toLocaleString()}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition = addText(
        `Analysis Mode: ${reportData.reportMetadata.analysisMode}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition += 10

      // Recommended Configuration Section
      checkPageBreak(60)
      doc.setFontSize(16)
      doc.setFont(undefined, "bold")
      doc.text("RECOMMENDED CONFIGURATION", margin, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont(undefined, "normal")
      yPosition = addText(
        `Hardware: ${reportData.recommendation.primaryRecommendation}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition = addText(
        `Expected Inference Time: ${reportData.recommendation.expectedInferenceTime.toFixed(2)} ms`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition = addText(
        `Cost per 1000 Inferences: $${reportData.recommendation.costPer1000Inferences.toFixed(4)}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )

      if (reportData.recommendation.peakMemoryUsage) {
        yPosition = addText(
          `Peak Memory Usage: ${reportData.recommendation.peakMemoryUsage.toFixed(2)} GB`,
          margin,
          yPosition,
          pageWidth - 2 * margin,
        )
      }

      yPosition += 5
      yPosition = addText(
        `Explanation: ${reportData.recommendation.explanation}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition += 10

      // Hardware Analysis Section
      if (reportData.hardwareAnalysis) {
        checkPageBreak(80)
        doc.setFontSize(16)
        doc.setFont(undefined, "bold")
        doc.text("HARDWARE ANALYSIS", margin, yPosition)
        yPosition += 10

        doc.setFontSize(10)
        doc.setFont(undefined, "normal")
        yPosition = addText(
          `Detected Hardware: ${reportData.hardwareAnalysis.detectedHardware}`,
          margin,
          yPosition,
          pageWidth - 2 * margin,
        )
        yPosition = addText(
          `Memory: ${reportData.hardwareAnalysis.specifications.memory}`,
          margin,
          yPosition,
          pageWidth - 2 * margin,
        )
        yPosition = addText(
          `Architecture: ${reportData.hardwareAnalysis.specifications.architecture}`,
          margin,
          yPosition,
          pageWidth - 2 * margin,
        )
        yPosition = addText(
          `Tensor Cores: ${reportData.hardwareAnalysis.specifications.tensorCores}`,
          margin,
          yPosition,
          pageWidth - 2 * margin,
        )
        yPosition = addText(
          `FP16 Performance: ${reportData.hardwareAnalysis.specifications.fp16Performance}`,
          margin,
          yPosition,
          pageWidth - 2 * margin,
        )
        yPosition = addText(
          `Power Consumption: ${reportData.hardwareAnalysis.specifications.powerConsumption}`,
          margin,
          yPosition,
          pageWidth - 2 * margin,
        )
        yPosition += 5

        yPosition = addText(
          `Use Case: ${reportData.hardwareAnalysis.insights.useCase}`,
          margin,
          yPosition,
          pageWidth - 2 * margin,
        )
        yPosition = addText(
          `Strengths: ${reportData.hardwareAnalysis.insights.strengths.join(", ")}`,
          margin,
          yPosition,
          pageWidth - 2 * margin,
        )
        yPosition = addText(
          `Considerations: ${reportData.hardwareAnalysis.insights.considerations.join(", ")}`,
          margin,
          yPosition,
          pageWidth - 2 * margin,
        )
        yPosition += 10
      }

      // Alternative Options Section
      if (reportData.alternatives.length > 0) {
        checkPageBreak(60)
        doc.setFontSize(16)
        doc.setFont(undefined, "bold")
        doc.text("ALTERNATIVE OPTIONS", margin, yPosition)
        yPosition += 10

        doc.setFontSize(10)
        doc.setFont(undefined, "normal")

        reportData.alternatives.forEach((alt, index) => {
          checkPageBreak(25)
          const specs = alt.specs
          yPosition = addText(
            `${index + 1}. ${alt.hardware} (${specs?.fullName || "N/A"})`,
            margin,
            yPosition,
            pageWidth - 2 * margin,
          )
          yPosition = addText(
            `   Inference Time: ${alt.performance.inferenceTime.toFixed(2)} ms`,
            margin + 10,
            yPosition,
            pageWidth - 2 * margin - 10,
          )
          yPosition = addText(
            `   Cost per 1000: $${alt.performance.costPer1000.toFixed(4)}`,
            margin + 10,
            yPosition,
            pageWidth - 2 * margin - 10,
          )

          if (specs) {
            yPosition = addText(
              `   Memory: ${specs.memory}, Architecture: ${specs.architecture}`,
              margin + 10,
              yPosition,
              pageWidth - 2 * margin - 10,
            )
          }

          const violations = []
          if (alt.performance.violatesLatency) violations.push("latency")
          if (alt.performance.violatesThroughput) violations.push("throughput")

          if (violations.length > 0) {
            yPosition = addText(
              `   ⚠️ Violates: ${violations.join(", ")} requirements`,
              margin + 10,
              yPosition,
              pageWidth - 2 * margin - 10,
            )
          } else {
            yPosition = addText(`   ✅ Meets all requirements`, margin + 10, yPosition, pageWidth - 2 * margin - 10)
          }
          yPosition += 3
        })
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setFont(undefined, "normal")
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, doc.internal.pageSize.getHeight() - 10)
        doc.text("Generated by AI Workload Optimizer", margin, doc.internal.pageSize.getHeight() - 10)
      }

      doc.save(`${filename}.pdf`)
    }
  }

  const recommendedSpecs = getHardwareSpecs(results.recommended_instance)

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
          {isPostDeployment ? "Optimization Results" : "Recommendation Results"}
        </h2>

        {/* Download Report Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadReport("json")}
            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-950/50"
          >
            <Download className="h-4 w-4 mr-1" />
            JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadReport("csv")}
            className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950/50"
          >
            <FileText className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadReport("pdf")}
            className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-950/50"
          >
            <FileText className="h-4 w-4 mr-1" />
            Report
          </Button>
        </div>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

          {/* Hardware Specifications Section */}
          {recommendedSpecs && (
            <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-800 dark:text-slate-200 flex items-center">
                  <Cpu className="h-5 w-5 mr-2" />
                  Hardware Analysis: {recommendedSpecs.fullName}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <HardDrive className="h-4 w-4 mr-2 text-blue-500" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Memory</p>
                      <p className="font-medium text-sm">{recommendedSpecs.memory}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">FP16 Performance</p>
                      <p className="font-medium text-sm">{recommendedSpecs.fp16Performance}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <Cpu className="h-4 w-4 mr-2 text-green-500" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Architecture</p>
                      <p className="font-medium text-sm">{recommendedSpecs.architecture}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">Strengths</h4>
                    <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                      {recommendedSpecs.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-3 w-3 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">Considerations</h4>
                    <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                      {recommendedSpecs.considerations.map((consideration, index) => (
                        <li key={index} className="flex items-start">
                          <AlertTriangle className="h-3 w-3 mr-2 mt-0.5 text-amber-500 flex-shrink-0" />
                          {consideration}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Use Case:</strong> {recommendedSpecs.useCase}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
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
                          Full Name
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
                      {results.alternatives.map((alt, index) => {
                        const specs = getHardwareSpecs(alt.hardware)
                        return (
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
                            <td className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-800 text-sm">
                              {specs?.fullName || "N/A"}
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
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="cards" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.alternatives.map((alt, index) => {
                    const specs = getHardwareSpecs(alt.hardware)
                    return (
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
                          {specs && (
                            <p
                              className={`text-xs ${
                                alt.hardware === results.recommended_instance
                                  ? "text-white/80"
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {specs.fullName}
                            </p>
                          )}
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
                            {specs && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-500 dark:text-slate-400">Memory:</span>
                                  <span className="font-medium text-sm">{specs.memory}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-slate-500 dark:text-slate-400">Architecture:</span>
                                  <span className="font-medium text-sm">{specs.architecture}</span>
                                </div>
                              </>
                            )}
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
                    )
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
