import { NextResponse } from "next/server"

// This is a mock API for testing purposes
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("Mock API received:", body)

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Return mock data
    return NextResponse.json({
      recommended_instance: "GPU_T4",
      expected_inference_time_ms: 45.32,
      cost_per_1000_inferences: 0.0234,
      peak_memory_usage_gb: 2.45,
    })
  } catch (error) {
    console.error("Error in mock API:", error)
    return NextResponse.json({ error: "Failed to process mock request" }, { status: 500 })
  }
}
