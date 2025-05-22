import { NextResponse } from "next/server"

// This is a mock API for testing purposes
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("Mock API received:", body)

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Return different mock data based on deployment mode and resource metrics
    if (body.is_post_deployment) {
      // Check if resource metrics are provided
      if (body.resource_metrics) {
        const metrics = body.resource_metrics

        // Use the metrics to determine the recommendation
        // This is a simplified example - in a real implementation, you would use more complex logic
        const gpuUtilization = metrics.gpu_utilization
        const memoryUsage = metrics.gpu_memory_usage

        // Example logic: If GPU utilization is low but memory usage is high, recommend a different instance
        if (gpuUtilization < 50 && memoryUsage > 70) {
          return NextResponse.json({
            recommended_instance: "A10g",
            expected_inference_time_ms: 28.45,
            cost_per_1000_inferences: 0.0165,
            explanation:
              "A10g is recommended based on your current resource metrics. Your current GPU utilization is low (under 50%) but memory usage is high (over 70%), suggesting a GPU with more memory but less compute power would be optimal.",
            alternatives: [
              {
                hardware: "A10g",
                inference_time_ms: 28.45,
                cost_per_1000: 0.0165,
                violates_latency: false,
                violates_throughput: false,
              },
              {
                hardware: "A100",
                inference_time_ms: 18.72,
                cost_per_1000: 0.0312,
                violates_latency: false,
                violates_throughput: false,
              },
              {
                hardware: "T4",
                inference_time_ms: 42.18,
                cost_per_1000: 0.0098,
                violates_latency: true,
                violates_throughput: false,
              },
              {
                hardware: "RTX_3070",
                inference_time_ms: 35.65,
                cost_per_1000: 0.0145,
                violates_latency: false,
                violates_throughput: false,
              },
            ],
          })
        } else if (gpuUtilization > 80) {
          // If GPU utilization is high, recommend a more powerful instance
          return NextResponse.json({
            recommended_instance: "A100",
            expected_inference_time_ms: 18.72,
            cost_per_1000_inferences: 0.0312,
            explanation:
              "A100 is recommended based on your current resource metrics. Your current GPU utilization is high (over 80%), suggesting you need a more powerful GPU to handle the workload efficiently.",
            alternatives: [
              {
                hardware: "A100",
                inference_time_ms: 18.72,
                cost_per_1000: 0.0312,
                violates_latency: false,
                violates_throughput: false,
              },
              {
                hardware: "H100",
                inference_time_ms: 12.35,
                cost_per_1000: 0.0425,
                violates_latency: false,
                violates_throughput: false,
              },
              {
                hardware: "A10g",
                inference_time_ms: 28.45,
                cost_per_1000: 0.0165,
                violates_latency: false,
                violates_throughput: true,
              },
              {
                hardware: "RTX_A5000",
                inference_time_ms: 25.92,
                cost_per_1000: 0.0185,
                violates_latency: false,
                violates_throughput: true,
              },
            ],
          })
        }
      }

      // Default post-deployment recommendation
      return NextResponse.json({
        recommended_instance: "A10",
        expected_inference_time_ms: 32.18,
        cost_per_1000_inferences: 0.0187,
        explanation:
          "A10 is recommended as a balanced option for your workload based on current resource utilization patterns.",
        alternatives: [
          {
            hardware: "A10",
            inference_time_ms: 32.18,
            cost_per_1000: 0.0187,
            violates_latency: false,
            violates_throughput: false,
          },
          {
            hardware: "A100",
            inference_time_ms: 18.72,
            cost_per_1000: 0.0312,
            violates_latency: false,
            violates_throughput: false,
          },
          {
            hardware: "T4",
            inference_time_ms: 45.32,
            cost_per_1000: 0.0098,
            violates_latency: false,
            violates_throughput: false,
          },
          {
            hardware: "RTX_3070",
            inference_time_ms: 38.45,
            cost_per_1000: 0.0145,
            violates_latency: false,
            violates_throughput: false,
          },
        ],
      })
    } else {
      // Pre-deployment recommendation
      return NextResponse.json({
        recommended_instance: "H100",
        expected_inference_time_ms: 0.88,
        cost_per_1000_inferences: 0.001,
        explanation:
          "H100 meets your SLA at $0.00100 per 1000 inferences and latency 0.88 ms. The next best is A100 at $0.00100 per 1000 inferences and latency 1.02 ms.",
        alternatives: [
          {
            hardware: "H100",
            inference_time_ms: 0.883,
            cost_per_1000: 0.001,
            violates_latency: false,
            violates_throughput: false,
          },
          {
            hardware: "A100",
            inference_time_ms: 1.021,
            cost_per_1000: 0.001,
            violates_latency: false,
            violates_throughput: false,
          },
          {
            hardware: "A10",
            inference_time_ms: 4.886,
            cost_per_1000: 0.001,
            violates_latency: false,
            violates_throughput: false,
          },
          {
            hardware: "RTX_3070",
            inference_time_ms: 7.968,
            cost_per_1000: 0.001,
            violates_latency: false,
            violates_throughput: false,
          },
          {
            hardware: "RTX_A5000",
            inference_time_ms: 5.586,
            cost_per_1000: 0.002,
            violates_latency: false,
            violates_throughput: false,
          },
        ],
      })
    }
  } catch (error) {
    console.error("Error in mock API:", error)
    return NextResponse.json({ error: "Failed to process mock request" }, { status: 500 })
  }
}
