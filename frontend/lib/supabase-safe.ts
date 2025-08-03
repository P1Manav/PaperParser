import { createClient } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"

// Safe Supabase client that handles missing environment variables
let supabase: ReturnType<typeof createClient> | null = null

const initializeSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables not found")
    return null
  }

  try {
    new URL(supabaseUrl) // Validate URL format
    return createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error("Invalid Supabase URL:", supabaseUrl)
    return null
  }
}

// Initialize client
supabase = initializeSupabase()

// Export safe client
export { supabase }

// Safe wrapper functions that check if client exists
export const signInWithGoogle = async () => {
  if (!supabase) throw new Error("Supabase not configured")

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
  if (!supabase) throw new Error("Supabase not configured")

  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error("Error signing out:", error)
    throw error
  }
}

export const saveGenerationHistory = async (userId: string, data: any) => {
  if (!supabase) throw new Error("Supabase not configured")

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
  if (!supabase) throw new Error("Supabase not configured")

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
  if (!supabase) throw new Error("Supabase not configured")

  try {
    const { error } = await supabase.from("generations").delete().eq("id", generationId)
    if (error) throw error
  } catch (error) {
    console.error("Error deleting generation:", error)
    throw error
  }
}

export const uploadFile = async (file: File, path: string) => {
  if (!supabase) throw new Error("Supabase not configured")

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
  if (!supabase) throw new Error("Supabase not configured")

  try {
    const { error } = await supabase.storage.from("uploads").remove([path])
    if (error) throw error
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  if (!supabase) {
    console.warn("Supabase not configured, auth state changes will not work")
    return { data: { subscription: { unsubscribe: () => {} } } }
  }

  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null)
  })
}

export const getCurrentUser = async () => {
  if (!supabase) return null

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

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null
}
