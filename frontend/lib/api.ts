const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://paperparser.onrender.com"

export interface GenerationRequest {
  file: File
  outputType: "presentation" | "Podcast" // Changed from PPT to presentation
  settings: {
    voice?: string
    length: string
    style?: string
    template?: string
    title?: string
    focusAreas?: string
    keyPoints?: string
  }
  userId: string
}

export interface GenerationResponse {
  message: string
  generationId: string
  status: string
}

export interface GenerationStatus {
  id: string
  user_id: string
  type: string
  title: string
  original_file_name: string
  original_file_url?: string
  download_url?: string
  status: "processing" | "completed" | "failed"
  settings: any
  duration?: string
  slides?: number
  file_size?: number
  error?: string
  created_at: string
  updated_at: string
}

export const generateContent = async (request: GenerationRequest): Promise<GenerationResponse> => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://paperparser.onrender.com"
  console.log("API URL:", API_URL) // Debug log

  const formData = new FormData()
  formData.append("file", request.file)
  formData.append("outputType", request.outputType)
  formData.append("userId", request.userId)
  formData.append("settings", JSON.stringify(request.settings))

  try {
    console.log("Making request to:", `${API_URL}/api/upload`) // Debug log

    const response = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary for FormData
    })

    console.log("Response status:", response.status) // Debug log
    console.log("Response headers:", Object.fromEntries(response.headers.entries())) // Debug log

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error response:", errorText) // Debug log

      let error
      try {
        error = JSON.parse(errorText)
      } catch {
        error = { error: errorText || `HTTP ${response.status}` }
      }

      throw new Error(error.error || "Failed to generate content")
    }

    const result = await response.json()
    console.log("Success response:", result) // Debug log
    return result
  } catch (error) {
    console.error("Fetch error:", error) // Debug log
    throw error
  }
}

export const getGenerationStatus = async (generationId: string): Promise<GenerationStatus> => {
  const response = await fetch(`${API_BASE_URL}/api/generation/${generationId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to get generation status")
  }

  return response.json()
}

export const getUserGenerations = async (userId: string): Promise<GenerationStatus[]> => {
  const response = await fetch(`${API_BASE_URL}/api/user/${userId}/generations`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to get user generations")
  }

  return response.json()
}

export const deleteGeneration = async (generationId: string, userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/generation/${generationId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to delete generation")
  }
}

// Polling function to check generation status
export const pollGenerationStatus = async (
  generationId: string,
  onUpdate: (status: GenerationStatus) => void,
  maxAttempts = 60,
  interval = 5000,
): Promise<GenerationStatus> => {
  let attempts = 0

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        attempts++
        const status = await getGenerationStatus(generationId)
        onUpdate(status)

        if (status.status === "completed" || status.status === "failed") {
          resolve(status)
          return
        }

        if (attempts >= maxAttempts) {
          reject(new Error("Generation timeout"))
          return
        }

        setTimeout(poll, interval)
      } catch (error) {
        reject(error)
      }
    }

    poll()
  })
}
