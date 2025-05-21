// API configuration
export const API_CONFIG = {
  // Change this to match your Flask server URL and port
  // If you're using ngrok, replace this with your ngrok URL
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  endpoints: {
    optimize: "/optimize",
  },
}
