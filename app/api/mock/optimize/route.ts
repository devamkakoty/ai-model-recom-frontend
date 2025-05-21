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
            recommended_instance: "GPU_A10g",
            expected_inference_time_ms: 28.45,
            cost_per_1000_inferences: 0.0165,
            peak_memory_usage_gb: 3.2,
          })
        } else if (gpuUtilization > 80) {
          // If GPU utilization is high, recommend a more powerful instance
          return NextResponse.json({
            recommended_instance: "GPU_A100",
            expected_inference_time_ms: 18.72,
            cost_per_1000_inferences: 0.0312,
            peak_memory_usage_gb: 2.8,
          })
        }
      }

      // Default post-deployment recommendation
      return NextResponse.json({
        recommended_instance: "GPU_A10",
        expected_inference_time_ms: 32.18,
        cost_per_1000_inferences: 0.0187,
        peak_memory_usage_gb: 1.95,
      })
    } else {
      // Pre-deployment recommendation
      return NextResponse.json({
        recommended_instance: "GPU_T4",
        expected_inference_time_ms: 45.32,
        cost_per_1000_inferences: 0.0234,
        peak_memory_usage_gb: 2.45,
      })
    }
  } catch (error) {
    console.error("Error in mock API:", error)
    return NextResponse.json({ error: "Failed to process mock request" }, { status: 500 })
  }
}
