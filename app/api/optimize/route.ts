import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("Request body:", body)

    // Update this URL to your actual Flask API endpoint
    const apiUrl = process.env.FLASK_API_URL || "https://91ae-122-171-18-92.ngrok-free.app/optimize"
    console.log("Calling API at:", apiUrl)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })

    // First check if the response is ok
    if (!response.ok) {
      // Try to get the response as text first
      const errorText = await response.text()
      console.error("API response error:", response.status, errorText)

      // Try to parse as JSON if possible
      let errorJson = null
      try {
        errorJson = JSON.parse(errorText)
      } catch (e) {
        // Not JSON, use the text as is
      }

      return NextResponse.json(
        {
          error: `Failed to get recommendations from backend: ${response.status} ${response.statusText}`,
          details: errorJson || errorText.substring(0, 200) + (errorText.length > 200 ? "..." : ""),
        },
        { status: response.status },
      )
    }

    // For successful responses, try to parse as JSON
    let data
    try {
      const responseText = await response.text()
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error("Failed to parse response as JSON:", responseText)
        return NextResponse.json(
          {
            error: "Invalid JSON response from server",
            details: responseText.substring(0, 200) + (responseText.length > 200 ? "..." : ""),
          },
          { status: 500 },
        )
      }
    } catch (error) {
      console.error("Error reading response:", error)
      return NextResponse.json(
        {
          error: "Failed to read response from server",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 },
      )
    }

    console.log("API response data:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in optimization API:", error)
    return NextResponse.json(
      {
        error: "Failed to process optimization request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
