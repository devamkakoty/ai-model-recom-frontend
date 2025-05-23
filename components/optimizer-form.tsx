"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import ResultsDisplay from "./results-display"
import { Loader2, AlertCircle } from "lucide-react"
import { FieldInfoTooltip } from "./field-info-tooltip"

// Define the types for our form data and API response
interface FormData {
  model_type: string
  framework: string
  task_type: string
  model_size: string
  parameters_millions: string
  flops_billions: string
  batch_size: string
  latency_requirement_ms: string
  throughput_requirement: string
}

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

interface ApiResponse {
  recommended_instance: string
  expected_inference_time_ms: number
  cost_per_1000_inferences: number
  peak_memory_usage_gb: number
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

interface OptimizerFormProps {
  isPostDeployment?: boolean
  resourceMetrics?: ResourceMetricsData | null
}

export default function OptimizerForm({ isPostDeployment = false, resourceMetrics = null }: OptimizerFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<ApiResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    model_type: "",
    framework: "",
    task_type: "",
    model_size: "",
    parameters_millions: "",
    flops_billions: "",
    batch_size: "",
    latency_requirement_ms: "",
    throughput_requirement: "",
  })

  const handleSelectChange = (field: keyof FormData, value: string) => {
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

  const handleInputChange = (field: keyof FormData, value: string) => {
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
        model_size_mb: Number.parseFloat(formData.model_size),
        parameters_millions: Number.parseFloat(formData.parameters_millions),
        flops_billions: Number.parseFloat(formData.flops_billions),
        batch_size: Number.parseInt(formData.batch_size, 10),
        latency_requirement_ms: formData.latency_requirement_ms
          ? Number.parseInt(formData.latency_requirement_ms, 10)
          : null,
        throughput_requirement: formData.throughput_requirement
          ? Number.parseInt(formData.throughput_requirement, 10)
          : null,
        is_post_deployment: isPostDeployment, // Add the deployment mode flag
      }

      // Add resource metrics data if in post-deployment mode and metrics are available
      if (isPostDeployment && resourceMetrics) {
        Object.assign(formattedData, {
          resource_metrics: {
            gpu_utilization: resourceMetrics.gpuUtilization,
            gpu_memory_usage: resourceMetrics.gpuMemoryUsage,
            cpu_utilization: resourceMetrics.cpuUtilization,
            ram_usage: resourceMetrics.ramUsage,
            disk_iops: resourceMetrics.diskIOPS,
            network_bandwidth: resourceMetrics.networkBandwidth,
            avg_latency: resourceMetrics.avgLatency,
            throughput: resourceMetrics.throughput,
          },
        })
      }

      console.log("Submitting form data:", formattedData)

      // Use the API endpoint
      const response = await fetch("https://hardware-recommendation-engine-555147084511.asia-south1.run.app/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

      if (!response.ok || responseData.error) {
        const errorMsg = responseData.error || `Error: ${response.status} ${response.statusText}`
        const details = responseData.details || responseText
        throw new Error(errorMsg, { cause: details })
      }

      // Check if the response has the expected structure
      if (!responseData.recommended_instance) {
        throw new Error("Invalid response format from API")
      }

      setResults(responseData)
      toast({
        title: "Success",
        description: "Recommendations generated successfully!",
      })
    } catch (error) {
      console.error("Error fetching recommendations:", error)
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
    } finally {
      setIsLoading(false)
    }
  }

  // Add this function after the handleSubmit function but before the tooltipContent definition

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
        model_size_mb: Number.parseFloat(formData.model_size),
        parameters_millions: Number.parseFloat(formData.parameters_millions),
        flops_billions: Number.parseFloat(formData.flops_billions),
        batch_size: Number.parseInt(formData.batch_size, 10),
        latency_requirement_ms: formData.latency_requirement_ms
          ? Number.parseInt(formData.latency_requirement_ms, 10)
          : null,
        throughput_requirement: formData.throughput_requirement
          ? Number.parseInt(formData.throughput_requirement, 10)
          : null,
        is_post_deployment: isPostDeployment, // Add the deployment mode flag
      }

      // Add resource metrics data if in post-deployment mode and metrics are available
      if (isPostDeployment && resourceMetrics) {
        Object.assign(formattedData, {
          resource_metrics: {
            gpu_utilization: resourceMetrics.gpuUtilization,
            gpu_memory_usage: resourceMetrics.gpuMemoryUsage,
            cpu_utilization: resourceMetrics.cpuUtilization,
            ram_usage: resourceMetrics.ramUsage,
            disk_iops: resourceMetrics.diskIOPS,
            network_bandwidth: resourceMetrics.networkBandwidth,
            avg_latency: resourceMetrics.avgLatency,
            throughput: resourceMetrics.throughput,
          },
        })
      }

      console.log("Submitting to mock API:", formattedData)

      // Use the mock API endpoint
      const response = await fetch("/api/mock/optimize", {
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
        description: "Mock recommendations generated successfully!",
      })
    } catch (error) {
      console.error("Error fetching mock recommendations:", error)
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
    model_size:
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
    latency_requirement_ms:
      "The maximum acceptable time in milliseconds for processing a single input. Lower values require more powerful hardware. Leave empty if not a requirement.",
    throughput_requirement:
      "The number of inputs that need to be processed per second. Higher values require more powerful hardware or multiple instances. Leave empty if not a requirement.",
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-8 shadow-xl border border-indigo-100 dark:border-indigo-900 overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-slate-900/80">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/50 dark:to-purple-950/50"></div>
        <CardHeader className="border-b border-indigo-100 dark:border-indigo-900 bg-white/90 dark:bg-slate-900/90">
          <CardTitle className="text-2xl text-indigo-700 dark:text-indigo-400">
            {isPostDeployment ? "Runtime Parameters" : "Workload Parameters"}
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            {isPostDeployment
              ? "Enter the details of your running AI workload to optimize hardware configuration"
              : "Enter the details of your AI workload to get hardware recommendations"}
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
                    <p className="mt-2 text-xs">
                      Make sure your Flask API server is running and accessible. Check the browser console for more
                      details.
                    </p>
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

            {/* Display a message if in post-deployment mode but no resource metrics are available */}
            {isPostDeployment && !resourceMetrics && (
              <div className="p-4 mb-4 text-sm text-amber-700 bg-amber-100 rounded-lg dark:bg-amber-900/30 dark:text-amber-300">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Resource Metrics Not Available</p>
                    <p>
                      No resource metrics data is available. Please refresh the resource metrics panel or manually input
                      values.
                    </p>
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
                  <Label htmlFor="model_size" className="text-slate-700 dark:text-slate-300">
                    Model Size (MB)
                  </Label>
                  <FieldInfoTooltip content={tooltipContent.model_size} />
                </div>
                <Input
                  id="model_size"
                  type="number"
                  placeholder="Enter model size in MB"
                  value={formData.model_size}
                  onChange={(e) => handleInputChange("model_size", e.target.value)}
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
                  <Label htmlFor="latency_requirement_ms" className="text-slate-700 dark:text-slate-300">
                    Latency Requirement (ms)
                  </Label>
                  <FieldInfoTooltip content={tooltipContent.latency_requirement_ms} />
                </div>
                <Input
                  id="latency_requirement_ms"
                  type="number"
                  placeholder="Optional - Enter max latency in ms"
                  value={formData.latency_requirement_ms}
                  onChange={(e) => handleInputChange("latency_requirement_ms", e.target.value)}
                  className="bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  step="1"
                  min="1"
                />
              </div>

              {/* Throughput Requirement */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="throughput_requirement" className="text-slate-700 dark:text-slate-300">
                    Throughput Requirement
                  </Label>
                  <FieldInfoTooltip content={tooltipContent.throughput_requirement} />
                </div>
                <Input
                  id="throughput_requirement"
                  type="number"
                  placeholder="Optional - Enter min throughput in QPS"
                  value={formData.throughput_requirement}
                  onChange={(e) => handleInputChange("throughput_requirement", e.target.value)}
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
              disabled={isLoading || (isPostDeployment && !resourceMetrics)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                `Get ${isPostDeployment ? "Optimized" : "Recommended"} Configuration`
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {results && <ResultsDisplay results={results} isPostDeployment={isPostDeployment} />}
    </div>
  )
}
