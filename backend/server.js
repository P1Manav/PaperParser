require("dotenv").config()
const express = require("express")
const multer = require("multer")
const path = require("path")
const { exec } = require("child_process")
const cors = require("cors")
const fs = require("fs")
const { createClient } = require("@supabase/supabase-js")
const app = express()
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://paperparser.vercel.app/", 
    /\.vercel\.app$/, 
    /\.code\.run$/,
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    "Access-Control-Allow-Origin",
  ],
  exposedHeaders: ["Content-Length", "X-Foo", "X-Bar"],
  maxAge: 86400, // 24 hours
}

app.use(cors(corsOptions))

// Handle preflight requests
app.options("*", cors(corsOptions))

// Additional middleware for handling CORS and requests
app.use((req, res, next) => {
  // Set CORS headers manually as backup
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*")
  res.header("Access-Control-Allow-Credentials", "true")
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,Authorization,Cache-Control,Pragma",
  )

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.sendStatus(200)
  } else {
    next()
  }
})

app.use(express.json())


// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate Supabase configuration
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase configuration!")
  console.error("Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file")
  process.exit(1)
}
console.log("✅ Supabase configured successfully")

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Directory setup
const uploadDir = path.join(__dirname, "uploads")
const scriptsDir = path.join(__dirname, "scripts")
const outputDir = path.join(__dirname, "outputs")

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
if (!fs.existsSync(scriptsDir)) fs.mkdirSync(scriptsDir, { recursive: true })
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

app.use("/outputs", express.static(outputDir))

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, Date.now() + ext)
  },
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"), false)
    }
    cb(null, true)
  },
})

// Helper functions
function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase()
  const contentTypes = {
    ".pdf": "application/pdf",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".mp3": "audio/mpeg",
  }
  return contentTypes[ext] || "application/octet-stream"
}

async function uploadToSupabaseStorage(filePath, fileName, bucket = "processed-files") {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, fileBuffer, {
      contentType: getContentType(fileName),
      upsert: true,
    })

    if (error) throw error

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error("Error uploading to Supabase Storage:", error)
    throw error
  }
}

async function saveGenerationRecord(userId, generationData) {
  try {
    const { data, error } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        ...generationData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error saving generation record:", error)
    throw error
  }
}

async function updateGenerationStatus(generationId, status, additionalData = {}) {
  try {
    const { data, error } = await supabase
      .from("generations")
      .update({
        status,
        ...additionalData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", generationId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error updating generation status:", error)
    throw error
  }
}

function isActualError(stderr) {
  if (!stderr) return false

  const warningPatterns = [
    /WARNING:/i,
    /grpc_wait_for_shutdown_with_timeout/i,
    /All log messages before absl::InitializeLog/i,
    /DeprecationWarning/i,
    /FutureWarning/i,
    /UserWarning/i,
  ]

  const lines = stderr.split("\n").filter((line) => line.trim())
  const errorLines = lines.filter((line) => {
    return !warningPatterns.some((pattern) => pattern.test(line))
  })

  return errorLines.length > 0
}

// Main upload and processing endpoint
app.post("/api/upload", upload.single("file"), async (req, res) => {
  let generationId = null

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    const uploadedFilePath = path.join(uploadDir, req.file.filename)
    const { outputType, settings, userId } = req.body

    // Validate required fields
    if (!outputType || !userId) {
      return res.status(400).json({ error: "Output type and user ID are required." })
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({ error: "Invalid user ID format." })
    }

    console.log("Processing request for user:", userId, "outputType:", outputType)

    // Parse settings
    let parsedSettings = {}
    try {
      parsedSettings = typeof settings === "string" ? JSON.parse(settings) : settings || {}
    } catch (e) {
      console.warn("Could not parse settings:", settings)
      parsedSettings = {}
    }

    // Upload original PDF to Supabase Storage
    const originalFileName = `${userId}/${Date.now()}_${req.file.originalname}`
    const originalFileUrl = await uploadToSupabaseStorage(uploadedFilePath, originalFileName, "uploads")

    // Create initial generation record
    const initialData = {
      type: outputType.toLowerCase(),
      title: req.file.originalname.replace(".pdf", ""),
      original_file_name: req.file.originalname,
      original_file_url: originalFileUrl,
      status: "processing",
      settings: parsedSettings,
    }

    console.log("Creating generation record:", initialData)
    const generationRecord = await saveGenerationRecord(userId, initialData)
    generationId = generationRecord.id

    // Script mapping - only presentation and podcast
    const scriptMap = {
      presentation: "ppt_gen.py",
      podcast: "generate_podcast.py",
    }

    const scriptName = scriptMap[outputType.toLowerCase()]
    if (!scriptName) {
      await updateGenerationStatus(generationId, "failed", { error: "Invalid output type" })
      return res.status(400).json({ error: "Invalid output type. Only 'presentation' and 'podcast' are supported." })
    }

    const pathToPythonScript = path.join(scriptsDir, scriptName)
    if (!fs.existsSync(pathToPythonScript)) {
      await updateGenerationStatus(generationId, "failed", { error: `Script ${scriptName} not found` })
      return res.status(500).json({ error: `Script ${scriptName} not found.` })
    }

    // Generate output file name
    const timestamp = Date.now()
    const outputFileName =
      outputType.toLowerCase() === "presentation"
        ? `${userId}/presentation_${timestamp}.pptx`
        : `${userId}/podcast_${timestamp}.mp3`

    const localOutputPath = path.join(outputDir, path.basename(outputFileName))

    console.log(`Executing ${scriptName} for ${outputType}...`)

    let command = ""

    if (outputType.toLowerCase() === "presentation") {
      const templateNumber = parsedSettings.template || "1"
      const length = parsedSettings.length || "medium"
      command = `python "${pathToPythonScript}" "${uploadedFilePath}" "${localOutputPath}" "${templateNumber}" "${length}"`
    } else if (outputType.toLowerCase() === "podcast") {
      const AlexVoice = parsedSettings.AlexVoice || "Kore"
      const AveryVoice = parsedSettings.AveryVoice || "Puck"
      const quality = parsedSettings.quality || "low"
      command = `python "${pathToPythonScript}" "${uploadedFilePath}" "${localOutputPath}" "${AlexVoice}" "${AveryVoice}" "${quality}"`
    }

    // Execute Python script
    exec(command, async (error, stdout, stderr) => {
      try {
        const hasActualError = error || isActualError(stderr)

        if (hasActualError) {
          console.error("Script error:", error || stderr)
          await updateGenerationStatus(generationId, "failed", {
            error: "Error running Python script",
            script_output: stderr || error?.message,
          })
          return
        }

        if (stderr) {
          console.warn("Script warnings:", stderr)
        }

        console.log(`Script output:\n${stdout}`)

        // Check if the output file was created
        if (!fs.existsSync(localOutputPath)) {
          console.error("Output file was not created:", localOutputPath)
          await updateGenerationStatus(generationId, "failed", {
            error: "Output file was not generated",
            script_output: stdout + "\n" + stderr,
          })
          return
        }

        console.log("Output file created successfully:", localOutputPath)

        // Upload processed file to Supabase Storage
        console.log("Uploading to Supabase Storage...")
        const processedFileUrl = await uploadToSupabaseStorage(localOutputPath, outputFileName, "processed-files")
        console.log("File uploaded to Supabase:", processedFileUrl)

        // Get file stats
        const stats = fs.statSync(localOutputPath)
        const fileSizeBytes = stats.size

        // Update generation record with success
        const updateData = {
          download_url: processedFileUrl,
          file_size: fileSizeBytes,
          script_output: stdout,
        }

        // Add type-specific metadata
        if (outputType.toLowerCase() === "podcast") {
          updateData.duration =
            parsedSettings.length === "short"
              ? "5-10 min"
              : parsedSettings.length === "medium"
                ? "15-25 min"
                : "30-45 min"
        } else if (outputType.toLowerCase() === "presentation") {
          updateData.slides = parsedSettings.length === "short" ? 8 : parsedSettings.length === "medium" ? 15 : 25
        }

        console.log("Updating generation status to completed...")
        await updateGenerationStatus(generationId, "completed", updateData)
        console.log("Generation completed successfully!")

        // Clean up local files
        try {
          fs.unlinkSync(uploadedFilePath)
          fs.unlinkSync(localOutputPath)
          console.log("Local files cleaned up")
        } catch (cleanupError) {
          console.warn("Could not clean up local files:", cleanupError)
        }
      } catch (processError) {
        console.error("Error in post-processing:", processError)
        await updateGenerationStatus(generationId, "failed", {
          error: "Error in post-processing",
          details: processError.message,
        })
      }
    })

    // Return immediate response with generation ID
    res.json({
      message: `${outputType} generation started`,
      generationId: generationId,
      status: "processing",
    })
  } catch (error) {
    console.error("Error in upload endpoint:", error)

    if (generationId) {
      await updateGenerationStatus(generationId, "failed", {
        error: "Server error",
        details: error.message,
      })
    }

    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    })
  }
})

// Get generation status endpoint
app.get("/api/generation/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase.from("generations").select("*").eq("id", id).single()

    if (error) {
      return res.status(404).json({ error: "Generation not found" })
    }

    res.json(data)
  } catch (error) {
    console.error("Error fetching generation:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get user generations endpoint
app.get("/api/user/:userId/generations", async (req, res) => {
  try {
    const { userId } = req.params
    const { limit = 50, offset = 0 } = req.query
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    res.json(data || [])
  } catch (error) {
    console.error("Error fetching user generations:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Delete generation endpoint
app.delete("/api/generation/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { userId } = req.body

    const { data: generation, error: fetchError } = await supabase
      .from("generations")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (fetchError || !generation) {
      return res.status(404).json({ error: "Generation not found or access denied" })
    }

    // Delete files from storage
    try {
      if (generation.original_file_url) {
        const originalPath = generation.original_file_url.split("public/uploads/")[1]
        if (originalPath) {
          await supabase.storage.from("uploads").remove([originalPath])
        }
      }

      if (generation.download_url) {
        const processedPath = generation.download_url.split("public/processed-files/")[1]
        if (processedPath) {
          await supabase.storage.from("processed-files").remove([processedPath])
        }
      }
    } catch (storageError) {
      console.warn("Could not delete files from storage:", storageError)
    }

    // Delete database record
    const { error: deleteError } = await supabase.from("generations").delete().eq("id", id).eq("user_id", userId)
    if (deleteError) throw deleteError

    res.json({ message: "Generation deleted successfully" })
  } catch (error) {
    console.error("Error deleting generation:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabase: !!supabaseUrl,
  })
})

const PORT = process.env.PORT || 5000
const backendUrl = process.env.RENDER_EXTERNAL_HOSTNAME
  ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
  : `http://localhost:${PORT}`

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on ${backendUrl}`)
  console.log(`✅ Supabase configured: ${!!supabaseUrl}`)
})

// Self-ping to keep server warm
//const PING_INTERVAL = 40 * 1000 // 40 seconds

//setInterval(() => {
//  fetch(`${backendUrl}/api/health`)
//    .then((res) => res.json())
//    .then((data) => console.log(`Self-ping successful: ${data.status} at ${new Date().toISOString()}`))
//    .catch((err) => console.error(`Self-ping failed: ${err.message} at ${new Date().toISOString()}`))
//}, PING_INTERVAL)
