"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  AlertCircle,
  Server,
  Clock,
  DollarSign,
  MemoryStick,
  Download,
  FileText,
  Cpu,
  Zap,
  HardDrive,
} from "lucide-react"
import { FieldInfoTooltip } from "./field-info-tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import jsPDF from "jspdf"

// Define the types for our form data and API response
interface SimulationFormData {
  model_type: string
  framework: string
  task_type: string
  model_size_mb: string
  parameters_millions: string
  flops_billions: string
  batch_size: string
  latency_req_ms: string
  throughput_req_qps: string
}

interface SimulationResult {
  hardware: string
  latency_ms: number
  throughput_qps: number
  cost_per_1000: number
  memory_gb: number
}

// Hardware specifications database (same as in results-display.tsx)
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

// Helper function to estimate FLOPs based on model type and parameters
const estimateFlops = (modelType: string, paramsMillion: number): string => {
  // These are rough estimates based on the provided data
  const multipliers: Record<string, number> = {
    // Vision models
    CNN_Small: 0.5, // Average of (0.1, 0.8)
    CNN_Large: 2.0, // Average of (1.0, 3.0)
    ResNet18: 0.5, // Average of (0.3, 0.7)
    ResNet50: 1.15, // Average of (0.8, 1.5)
    ResNet101: 2.0, // Average of (1.5, 2.5)
    MobileNetV2: 0.25, // Average of (0.1, 0.4)
    MobileNetV3: 0.3, // Average of (0.1, 0.5)
    EfficientNet_B0: 0.4, // Average of (0.2, 0.6)
    EfficientNet_B4: 1.3, // Average of (0.8, 1.8)
    ViT_Small: 1.0, // Average of (0.5, 1.5)
    ViT_Base: 2.0, // Average of (1.0, 3.0)
    ViT_Large: 4.0, // Average of (2.0, 6.0)
    ConvNeXt_Tiny: 1.3, // Average of (0.8, 1.8)
    ConvNeXt_Base: 3.0, // Average of (2.0, 4.0)
    YOLO_v5s: 0.55, // Average of (0.3, 0.8)
    YOLO_v8m: 1.7, // Average of (1.2, 2.2)

    // NLP models
    LSTM_Small: 0.5, // Average of (0.2, 0.8)
    LSTM_Large: 1.25, // Average of (0.5, 2.0)
    GRU_Medium: 0.75, // Average of (0.3, 1.2)
    BERT_tiny: 0.3, // Average of (0.1, 0.5)
    BERT_base: 1.65, // Average of (0.8, 2.5)
    BERT_large: 4.0, // Average of (2.0, 6.0)
    RoBERTa_base: 1.8, // Average of (0.8, 2.8)
    DistilBERT: 0.95, // Average of (0.4, 1.5)
    GPT2_small: 1.9, // Average of (0.8, 3.0)
    GPT2_medium: 4.5, // Average of (2.0, 7.0)
    GPT2_large: 9.5, // Average of (4.0, 15.0)
    T5_small: 1.25, // Average of (0.5, 2.0)
    T5_base: 3.25, // Average of (1.5, 5.0)
    Transformer_Small: 0.75, // Average of (0.3, 1.2)
    Transformer_Base: 1.9, // Average of (0.8, 3.0)
    LLaMA_7B: 100, // Average of (50, 150)
    LLaMA_13B: 200, // Average of (100, 300)
  }

  // Get the multiplier for the model type
  const multiplier = multipliers[modelType] || 2.0

  // Estimate FLOPs in billions
  return (paramsMillion * multiplier).toFixed(2)
}

export function SimulatePerformance() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SimulationResult[] | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [activeResultTab, setActiveResultTab] = useState<string>("table")
  const [formData, setFormData] = useState<SimulationFormData>({
    model_type: "",
    framework: "",
    task_type: "inference",
    model_size_mb: "",
    parameters_millions: "",
    flops_billions: "",
    batch_size: "",
    latency_req_ms: "",
    throughput_req_qps: "",
  })

  const getHardwareSpecs = (hardwareName: string) => {
    return hardwareSpecs[hardwareName as keyof typeof hardwareSpecs] || null
  }

  const generateSimulationReport = () => {
    const timestamp = new Date().toISOString()

    return {
      reportMetadata: {
        generatedAt: timestamp,
        reportType: "Performance Simulation Report",
        modelConfiguration: {
          modelType: formData.model_type,
          framework: formData.framework,
          taskType: formData.task_type,
          modelSizeMB: Number.parseFloat(formData.model_size_mb),
          parametersMillions: Number.parseFloat(formData.parameters_millions),
          flopsBillions: Number.parseFloat(formData.flops_billions),
          batchSize: Number.parseInt(formData.batch_size, 10),
          latencyRequirement: formData.latency_req_ms ? Number.parseInt(formData.latency_req_ms, 10) : null,
          throughputRequirement: formData.throughput_req_qps ? Number.parseInt(formData.throughput_req_qps, 10) : null,
        },
      },
      simulationResults:
        results?.map((result) => ({
          hardware: result.hardware,
          specs: getHardwareSpecs(result.hardware),
          performance: {
            latencyMs: result.latency_ms,
            throughputQps: result.throughput_qps,
            costPer1000: result.cost_per_1000,
            memoryGb: result.memory_gb,
          },
        })) || [],
    }
  }

  const downloadSimulationReport = (format: "json" | "csv" | "pdf") => {
    if (!results) return

    const reportData = generateSimulationReport()
    const timestamp = new Date().toISOString().split("T")[0]
    const filename = `simulation_report_${timestamp}`

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
        "Hardware,Full Name,Latency (ms),Throughput (QPS),Cost per 1000,Memory (GB),Architecture,Memory Spec\n"

      results.forEach((result) => {
        const specs = getHardwareSpecs(result.hardware)
        csvContent += `${result.hardware},"${specs?.fullName || "N/A"}",${result.latency_ms},${result.throughput_qps},${result.cost_per_1000},${result.memory_gb},"${specs?.architecture || "N/A"}","${specs?.memory || "N/A"}"\n`
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
      doc.text("PERFORMANCE SIMULATION REPORT", margin, yPosition)
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
      yPosition += 10

      // Model Configuration Section
      checkPageBreak(80)
      doc.setFontSize(16)
      doc.setFont(undefined, "bold")
      doc.text("MODEL CONFIGURATION", margin, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont(undefined, "normal")
      yPosition = addText(
        `Model Type: ${reportData.reportMetadata.modelConfiguration.modelType}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition = addText(
        `Framework: ${reportData.reportMetadata.modelConfiguration.framework}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition = addText(
        `Task Type: ${reportData.reportMetadata.modelConfiguration.taskType}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition = addText(
        `Model Size: ${reportData.reportMetadata.modelConfiguration.modelSizeMB} MB`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition = addText(
        `Parameters: ${reportData.reportMetadata.modelConfiguration.parametersMillions} million`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition = addText(
        `FLOPs: ${reportData.reportMetadata.modelConfiguration.flopsBillions} billion`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )
      yPosition = addText(
        `Batch Size: ${reportData.reportMetadata.modelConfiguration.batchSize}`,
        margin,
        yPosition,
        pageWidth - 2 * margin,
      )

      if (reportData.reportMetadata.modelConfiguration.latencyRequirement) {
        yPosition = addText(
          `Latency Requirement: ${reportData.reportMetadata.modelConfiguration.latencyRequirement} ms`,
          margin,
          yPosition,
          pageWidth - 2 * margin,
        )
      }
      if (reportData.reportMetadata.modelConfiguration.throughputRequirement) {
        yPosition = addText(
          `Throughput Requirement: ${reportData.reportMetadata.modelConfiguration.throughputRequirement} QPS`,
          margin,
          yPosition,
          pageWidth - 2 * margin,
        )
      }
      yPosition += 10

      // Simulation Results Section
      checkPageBreak(60)
      doc.setFontSize(16)
      doc.setFont(undefined, "bold")
      doc.text("SIMULATION RESULTS", margin, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont(undefined, "normal")

      results.forEach((result, index) => {
        checkPageBreak(35)
        const specs = getHardwareSpecs(result.hardware)

        doc.setFont(undefined, "bold")
        yPosition = addText(`${index + 1}. ${result.hardware}`, margin, yPosition, pageWidth - 2 * margin, 11)

        doc.setFont(undefined, "normal")
        if (specs) {
          yPosition = addText(`   ${specs.fullName}`, margin, yPosition, pageWidth - 2 * margin, 9)
        }

        yPosition = addText(
          `   Latency: ${result.latency_ms.toFixed(2)} ms`,
          margin + 10,
          yPosition,
          pageWidth - 2 * margin - 10,
        )
        yPosition = addText(
          `   Throughput: ${result.throughput_qps.toFixed(2)} QPS`,
          margin + 10,
          yPosition,
          pageWidth - 2 * margin - 10,
        )
        yPosition = addText(
          `   Cost per 1000: $${result.cost_per_1000.toFixed(4)}`,
          margin + 10,
          yPosition,
          pageWidth - 2 * margin - 10,
        )
        yPosition = addText(
          `   Memory: ${result.memory_gb.toFixed(1)} GB`,
          margin + 10,
          yPosition,
          pageWidth - 2 * margin - 10,
        )

        if (specs) {
          yPosition = addText(
            `   Architecture: ${specs.architecture}`,
            margin + 10,
            yPosition,
            pageWidth - 2 * margin - 10,
          )
          yPosition = addText(`   Memory Spec: ${specs.memory}`, margin + 10, yPosition, pageWidth - 2 * margin - 10)
          yPosition = addText(`   Use Case: ${specs.useCase}`, margin + 10, yPosition, pageWidth - 2 * margin - 10)
        }
        yPosition += 5
      })

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

  const handleSelectChange = (field: keyof SimulationFormData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // If model_type and parameters_millions are both set, estimate FLOPs
      if (field === "model_type" || field === "parameters_millions") {
        if (newData.model_type && newData.parameters_millions) {
          const params = Number.parseFloat(newData.parameters_millions)
          if (!isNaN(params)) {
            newData.flops_billions = estimateFlops(newData.model_type, params)
          }
        }
      }

      return newData
    })
  }

  const handleInputChange = (field: keyof SimulationFormData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // If parameters_millions changes and model_type is set, estimate FLOPs
      if (field === "parameters_millions" && newData.model_type) {
        const params = Number.parseFloat(value)
        if (!isNaN(params)) {
          newData.flops_billions = estimateFlops(newData.model_type, params)
        }
      }

      return newData
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResults(null)
    setErrorMessage(null)
    setErrorDetails(null)

    try {
      // Format the data to match the expected types
      const formattedData = {
        model_type: formData.model_type,
        framework: formData.framework,
        task_type: formData.task_type,
        model_size_mb: Number.parseFloat(formData.model_size_mb),
        parameters_millions: Number.parseFloat(formData.parameters_millions),
        flops_billions: Number.parseFloat(formData.flops_billions),
        batch_size: Number.parseInt(formData.batch_size, 10),
        latency_req_ms: formData.latency_req_ms ? Number.parseInt(formData.latency_req_ms, 10) : null,
        throughput_req_qps: formData.throughput_req_qps ? Number.parseInt(formData.throughput_req_qps, 10) : null,
      }

      console.log("Submitting simulation data:", formattedData)

      // Use the real API endpoint
      const apiUrl = "https://hardware-recommendation-engine-555147084511.asia-south1.run.app/simulate"
      console.log("Calling API at:", apiUrl)

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formattedData),
      })

      // First get the response as text to handle potential non-JSON responses
      const responseText = await response.text()
      console.log("Raw API response:", responseText)

      // Try to parse the response as JSON
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse response as JSON:", e)
        throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}...`)
      }

      console.log("Parsed API response:", responseData)

      if (!response.ok || (responseData.error && typeof responseData.error === "string")) {
        const errorMsg = responseData.error || `Error: ${response.status} ${response.statusText}`
        const details = responseData.details || responseText
        throw new Error(errorMsg, { cause: details })
      }

      // Check if the response is an array
      if (!Array.isArray(responseData)) {
        throw new Error("Invalid response format from API: Expected an array of hardware options")
      }

      setResults(responseData)
      toast({
        title: "Success",
        description: "Performance simulation completed successfully!",
      })
    } catch (error) {
      console.error("Error simulating performance:", error)
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred"
      const errorDetails = error instanceof Error && error.cause ? String(error.cause) : undefined

      setErrorMessage(errorMsg)
      if (errorDetails) {
        setErrorDetails(errorDetails)
      }

      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })

      // Offer to try the mock API instead
      setErrorDetails((prev) => {
        return (prev || "") + "\n\nYou can try using the mock API instead by clicking the button below."
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to use the mock API as a fallback
  const handleMockSubmit = async () => {
    setIsLoading(true)
    setResults(null)
    setErrorMessage(null)
    setErrorDetails(null)

    try {
      // Format the data to match the expected types
      const formattedData = {
        model_type: formData.model_type,
        framework: formData.framework,
        task_type: formData.task_type,
        model_size_mb: Number.parseFloat(formData.model_size_mb),
        parameters_millions: Number.parseFloat(formData.parameters_millions),
        flops_billions: Number.parseFloat(formData.flops_billions),
        batch_size: Number.parseInt(formData.batch_size, 10),
        latency_req_ms: formData.latency_req_ms ? Number.parseInt(formData.latency_req_ms, 10) : null,
        throughput_req_qps: formData.throughput_req_qps ? Number.parseInt(formData.throughput_req_qps, 10) : null,
      }

      console.log("Submitting to mock API:", formattedData)

      // Use the mock API endpoint
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      })

      const responseData = await response.json()
      console.log("Mock API response:", responseData)

      if (!response.ok || responseData.error) {
        throw new Error(responseData.error || `Error: ${response.status} ${response.statusText}`)
      }

      setResults(responseData)
      toast({
        title: "Success",
        description: "Mock simulation completed successfully!",
      })
    } catch (error) {
      console.error("Error with mock simulation:", error)
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred"
      setErrorMessage(errorMsg)

      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Define tooltip content for each field
  const tooltipContent = {
    model_type:
      "Select the specific model architecture you're using. This helps determine the computational requirements.",
    framework:
      "The deep learning framework you're using. Different frameworks may have different performance characteristics on the same hardware.",
    task_type:
      "Training requires more computational resources than inference. This significantly impacts hardware recommendations.",
    model_size_mb:
      "The size of your model in megabytes. This affects memory requirements and can be found in your model's documentation or by checking the saved model file size.",
    parameters_millions:
      "The number of trainable parameters in your model in millions. For example, a model with 5 million parameters would be entered as 5.",
    flops_billions: (
      <div>
        <p>
          Floating Point Operations per second in billions. This is automatically estimated based on your model type and
          parameters, but you can override it if you know the exact value.
        </p>
        <p className="mt-1 font-semibold">Estimation formula:</p>
        <p>FLOPs ≈ Parameters × Model-specific multiplier</p>
        <ul className="mt-1 list-disc list-inside text-xs">
          <li>Transformer models (BERT, GPT, T5): 4-6× multiplier</li>
          <li>CNN models: 1.5-2.5× multiplier</li>
          <li>RNN/LSTM models: 3× multiplier</li>
        </ul>
      </div>
    ),
    batch_size:
      "The number of samples processed in a single forward/backward pass. Larger batch sizes require more memory but can improve throughput.",
    latency_req_ms:
      "The maximum acceptable time in milliseconds for processing a single input. Lower values require more powerful hardware. Leave empty if not a requirement.",
    throughput_req_qps:
      "The number of queries that need to be processed per second. Higher values require more powerful hardware. Leave empty if not a requirement.",
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-8 shadow-xl border border-indigo-100 dark:border-indigo-900 overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/50 dark:to-purple-950/50"></div>
        <CardHeader className="border-b border-indigo-100 dark:border-indigo-900 bg-white/90 dark:bg-slate-900/90">
          <CardTitle className="text-2xl text-indigo-700 dark:text-indigo-400">Simulation Parameters</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Enter your AI workload details to simulate performance across different hardware options
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-6 pt-6">
            {errorMessage && (
              <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-300">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Error:</p>
                    <p>{errorMessage}</p>
                    {errorDetails && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium">Show details</summary>
                        <pre className="mt-2 whitespace-pre-wrap text-xs overflow-auto max-h-40 p-2 bg-red-50 dark:bg-red-900/50 rounded">
                          {errorDetails}
                        </pre>
                      </details>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-xs py-1 h-auto"
                        onClick={() => {
                          // Try the mock API instead
                          setErrorMessage("Trying mock API instead...")
                          setTimeout(() => {
                            setErrorMessage(null)
                            // Submit to mock API
                            handleMockSubmit()
                          }, 1000)
                        }}
                      >
                        Try Mock API
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Model Type */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="model_type" className="text-slate-700 dark:text-slate-300">
                    Model Type
                  </Label>
                  <FieldInfoTooltip content={tooltipContent.model_type} />
                </div>
                <Select
                  value={formData.model_type}
                  onValueChange={(value) => handleSelectChange("model_type", value)}
                  required
                >
                  <SelectTrigger
                    id="model_type"
                    className="bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  >
                    <SelectValue placeholder="Select model type" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Vision Models */}
                    <SelectItem value="CNN_Small">CNN Small</SelectItem>
                    <SelectItem value="CNN_Large">CNN Large</SelectItem>
                    <SelectItem value="ResNet18">ResNet18</SelectItem>
                    <SelectItem value="ResNet50">ResNet50</SelectItem>
                    <SelectItem value="ResNet101">ResNet101</SelectItem>
                    <SelectItem value="MobileNetV2">MobileNetV2</SelectItem>
                    <SelectItem value="MobileNetV3">MobileNetV3</SelectItem>
                    <SelectItem value="EfficientNet_B0">EfficientNet B0</SelectItem>
                    <SelectItem value="EfficientNet_B4">EfficientNet B4</SelectItem>
                    <SelectItem value="ViT_Small">ViT Small</SelectItem>
                    <SelectItem value="ViT_Base">ViT Base</SelectItem>
                    <SelectItem value="ViT_Large">ViT Large</SelectItem>
                    <SelectItem value="ConvNeXt_Tiny">ConvNeXt Tiny</SelectItem>
                    <SelectItem value="ConvNeXt_Base">ConvNeXt Base</SelectItem>
                    <SelectItem value="YOLO_v5s">YOLO v5s</SelectItem>
                    <SelectItem value="YOLO_v8m">YOLO v8m</SelectItem>

                    {/* NLP Models */}
                    <SelectItem value="LSTM_Small">LSTM Small</SelectItem>
                    <SelectItem value="LSTM_Large">LSTM Large</SelectItem>
                    <SelectItem value="GRU_Medium">GRU Medium</SelectItem>
                    <SelectItem value="BERT_tiny">BERT Tiny</SelectItem>
                    <SelectItem value="BERT_base">BERT Base</SelectItem>
                    <SelectItem value="BERT_large">BERT Large</SelectItem>
                    <SelectItem value="RoBERTa_base">RoBERTa Base</SelectItem>
                    <SelectItem value="DistilBERT">DistilBERT</SelectItem>
                    <SelectItem value="GPT2_small">GPT2 Small</SelectItem>
                    <SelectItem value="GPT2_medium">GPT2 Medium</SelectItem>
                    <SelectItem value="GPT2_large">GPT2 Large</SelectItem>
                    <SelectItem value="T5_small">T5 Small</SelectItem>
                    <SelectItem value="T5_base">T5 Base</SelectItem>
                    <SelectItem value="Transformer_Small">Transformer Small</SelectItem>
                    <SelectItem value="Transformer_Base">Transformer Base</SelectItem>
                    <SelectItem value="LLaMA_7B">LLaMA 7B</SelectItem>
                    <SelectItem value="LLaMA_13B">LLaMA 13B</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Framework */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="framework" className="text-slate-700 dark:text-slate-300">
                    Framework
                  </Label>
                  <FieldInfoTooltip content={tooltipContent.framework} />
                </div>
                <Select
                  value={formData.framework}
                  onValueChange={(value) => handleSelectChange("framework", value)}
                  required
                >
                  <SelectTrigger
                    id="framework"
                    className="bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  >
                    <SelectValue placeholder="Select framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pytorch">PyTorch</SelectItem>
                    <SelectItem value="tensorflow">TensorFlow</SelectItem>
                    <SelectItem value="jax">JAX</SelectItem>
                    <SelectItem value="onnx">ONNX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Task Type */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="task_type" className="text-slate-700 dark:text-slate-300">
                    Task Type
                  </Label>
                  <FieldInfoTooltip content={tooltipContent.task_type} />
                </div>
                <Select
                  value={formData.task_type}
                  onValueChange={(value) => handleSelectChange("task_type", value)}
                  required
                >
                  <SelectTrigger
                    id="task_type"
                    className="bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  >
                    <SelectValue placeholder="Select task type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="inference">Inference</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Model Size (MB) */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="model_size_mb" className="text-slate-700 dark:text-slate-300">
                    Model Size (MB)
                  </Label>
                  <FieldInfoTooltip content={tooltipContent.model_size_mb} />
                </div>
                <Input
                  id="model_size_mb"
                  type="number"
                  placeholder="Enter model size in MB"
                  value={formData.model_size_mb}
                  onChange={(e) => handleInputChange("model_size_mb", e.target.value)}
                  className="bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  required
                  step="0.01"
                />
              </div>

              {/* Parameters (Millions) */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="parameters_millions" className="text-slate-700 dark:text-slate-300">
                    Parameters (Millions)
                  </Label>
                  <FieldInfoTooltip content={tooltipContent.parameters_millions} />
                </div>
                <Input
                  id="parameters_millions"
                  type="number"
                  placeholder="Enter parameters in millions"
                  value={formData.parameters_millions}
                  onChange={(e) => handleInputChange("parameters_millions", e.target.value)}
                  className="bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  required
                  step="0.01"
                />
              </div>

              {/* FLOPs (Billions) */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="flops_billions" className="text-slate-700 dark:text-slate-300">
                    FLOPs (Billions)
                  </Label>
                  <FieldInfoTooltip content={tooltipContent.flops_billions} />
                </div>
                <Input
                  id="flops_billions"
                  type="number"
                  placeholder="Enter FLOPs in billions"
                  value={formData.flops_billions}
                  onChange={(e) => handleInputChange("flops_billions", e.target.value)}
                  className="bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  required
                  step="0.01"
                />
              </div>

              {/* Batch Size */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="batch_size" className="text-slate-700 dark:text-slate-300">
                    Batch Size
                  </Label>
                  <FieldInfoTooltip content={tooltipContent.batch_size} />
                </div>
                <Input
                  id="batch_size"
                  type="number"
                  placeholder="Enter batch size"
                  value={formData.batch_size}
                  onChange={(e) => handleInputChange("batch_size", e.target.value)}
                  className="bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  required
                  step="1"
                  min="1"
                />
              </div>

              {/* Latency Requirement (ms) */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="latency_req_ms" className="text-slate-700 dark:text-slate-300">
                    Latency Requirement (ms)
                  </Label>
                  <FieldInfoTooltip content={tooltipContent.latency_req_ms} />
                </div>
                <Input
                  id="latency_req_ms"
                  type="number"
                  placeholder="Optional - Enter max latency in ms"
                  value={formData.latency_req_ms}
                  onChange={(e) => handleInputChange("latency_req_ms", e.target.value)}
                  className="bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  step="1"
                  min="1"
                />
              </div>

              {/* Throughput Requirement (QPS) */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="throughput_req_qps" className="text-slate-700 dark:text-slate-300">
                    Throughput Requirement (QPS)
                  </Label>
                  <FieldInfoTooltip content={tooltipContent.throughput_req_qps} />
                </div>
                <Input
                  id="throughput_req_qps"
                  type="number"
                  placeholder="Optional - Enter min throughput in QPS"
                  value={formData.throughput_req_qps}
                  onChange={(e) => handleInputChange("throughput_req_qps", e.target.value)}
                  className="bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  step="1"
                  min="1"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-indigo-100 dark:border-indigo-900 bg-white/90 dark:bg-slate-900/90 py-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-600 dark:hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                "Simulate Performance"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {results && results.length > 0 && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              Simulation Results
            </h2>

            {/* Download Report Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadSimulationReport("json")}
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-950/50"
              >
                <Download className="h-4 w-4 mr-1" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadSimulationReport("csv")}
                className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950/50"
              >
                <FileText className="h-4 w-4 mr-1" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadSimulationReport("pdf")}
                className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-950/50"
              >
                <FileText className="h-4 w-4 mr-1" />
                Report
              </Button>
            </div>
          </div>

          <Card className="shadow-xl border border-indigo-100 dark:border-indigo-900 overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 relative">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/50 dark:to-purple-950/50"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>

            <CardHeader className="pb-2 border-b border-indigo-100 dark:border-indigo-900 bg-white/90 dark:bg-slate-900/90">
              <CardTitle className="text-2xl text-center text-indigo-700 dark:text-indigo-400">
                Hardware Performance Comparison
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
              <Tabs value={activeResultTab} onValueChange={setActiveResultTab} className="w-full">
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
                            Latency (ms)
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-indigo-700 dark:text-indigo-300 border-b border-indigo-100 dark:border-indigo-800">
                            Throughput (QPS)
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-indigo-700 dark:text-indigo-300 border-b border-indigo-100 dark:border-indigo-800">
                            Cost per 1000
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-indigo-700 dark:text-indigo-300 border-b border-indigo-100 dark:border-indigo-800">
                            Memory (GB)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result, index) => {
                          const specs = getHardwareSpecs(result.hardware)
                          return (
                            <tr
                              key={index}
                              className={`${
                                index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-indigo-50/30 dark:bg-indigo-900/10"
                              } hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors`}
                            >
                              <td className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-800 font-medium">
                                {result.hardware}
                              </td>
                              <td className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-800 text-sm">
                                {specs?.fullName || "N/A"}
                              </td>
                              <td className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-800">
                                {result.latency_ms.toFixed(2)} ms
                              </td>
                              <td className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-800">
                                {result.throughput_qps.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-800">
                                ${result.cost_per_1000.toFixed(4)}
                              </td>
                              <td className="px-4 py-3 border-b border-indigo-100 dark:border-indigo-800">
                                {result.memory_gb.toFixed(1)} GB
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="cards" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {results.map((result, index) => {
                      const specs = getHardwareSpecs(result.hardware)
                      return (
                        <Card
                          key={index}
                          className="overflow-hidden border border-indigo-100 dark:border-indigo-900 hover:shadow-lg transition-shadow duration-200"
                        >
                          <CardHeader className="pb-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                            <CardTitle className="text-xl">{result.hardware}</CardTitle>
                            {specs && <p className="text-xs text-white/80">{specs.fullName}</p>}
                          </CardHeader>
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center">
                                <Clock className="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Latency</p>
                                  <p className="font-medium">{result.latency_ms.toFixed(2)} ms</p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <Server className="h-5 w-5 mr-2 text-blue-500 dark:text-blue-400" />
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Throughput</p>
                                  <p className="font-medium">{result.throughput_qps.toFixed(2)} QPS</p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="h-5 w-5 mr-2 text-green-500 dark:text-green-400" />
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Cost per 1000</p>
                                  <p className="font-medium">${result.cost_per_1000.toFixed(4)}</p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <MemoryStick className="h-5 w-5 mr-2 text-purple-500 dark:text-purple-400" />
                                <div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Memory</p>
                                  <p className="font-medium">{result.memory_gb.toFixed(1)} GB</p>
                                </div>
                              </div>
                            </div>

                            {/* Hardware Specifications */}
                            {specs && (
                              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="flex items-center">
                                    <Cpu className="h-3 w-3 mr-1 text-slate-400" />
                                    <span className="text-slate-500 dark:text-slate-400">Arch:</span>
                                    <span className="ml-1 font-medium">{specs.architecture}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <HardDrive className="h-3 w-3 mr-1 text-slate-400" />
                                    <span className="text-slate-500 dark:text-slate-400">Mem:</span>
                                    <span className="ml-1 font-medium">{specs.memory}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Zap className="h-3 w-3 mr-1 text-slate-400" />
                                    <span className="text-slate-500 dark:text-slate-400">FP16:</span>
                                    <span className="ml-1 font-medium">{specs.fp16Performance}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-slate-500 dark:text-slate-400">Power:</span>
                                    <span className="ml-1 font-medium">{specs.powerConsumption}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
