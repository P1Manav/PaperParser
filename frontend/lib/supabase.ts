import { createClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env.local file and ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
  )
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  throw new Error(
    `Invalid NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}. Please ensure it's a valid URL (e.g., https://your-project.supabase.co)`,
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth functions
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
    return data
  } catch (error) {
    console.error("Error signing in with Google:", error)
    throw error
  }
}

export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

// Database functions
export const saveGenerationHistory = async (userId: string, data: any) => {
  try {
    const { data: result, error } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        ...data,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return result.id
  } catch (error) {
    console.error("Error saving generation history:", error)
    throw error
  }
}

export const getUserGenerations = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error("Error fetching user generations:", error)
    throw error
  }
}

export const deleteGeneration = async (generationId: string) => {
  try {
    const { error } = await supabase.from("generations").delete().eq("id", generationId)

    if (error) throw error
  } catch (error) {
    console.error("Error deleting generation:", error)
    throw error
  }
}

// Storage functions
export const uploadFile = async (file: File, path: string) => {
  try {
    const { data, error } = await supabase.storage.from("uploads").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from("uploads").getPublicUrl(path)

    return publicUrl
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

export const deleteFile = async (path: string) => {
  try {
    const { error } = await supabase.storage.from("uploads").remove([path])

    if (error) throw error
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}

// Auth state listener
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null)
  })
}

// Get current user
export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
