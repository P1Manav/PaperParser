const express = require("express");
const multer = require("multer");
const path = require("path");
const { exec } = require("child_process");
const cors = require("cors");
const fs = require("fs");

const app = express();

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Ensure the `uploads` and `scripts` directories exist
const uploadDir = path.join(__dirname, "uploads");
const scriptsDir = path.join(__dirname, "scripts");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(scriptsDir)) fs.mkdirSync(scriptsDir, { recursive: true });

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Save files in the "uploads" directory
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get file extension
    cb(null, Date.now() + ext); // Use a timestamped file name
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"), false);
    }
    cb(null, true);
  },
});

// API route to handle file upload and script execution
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const uploadedFilePath = path.join(uploadDir, req.file.filename);
  console.log("Uploaded file:", req.file);
  console.log("Saved to:", uploadedFilePath);

  const { outputType } = req.body;
  if (!outputType) {
    return res.status(400).json({ error: "Output type is required." });
  }

  // Map output types to corresponding Python scripts
  const scriptMap = {
    "PPT": "generate_ppt.py",
    "Podcast": "generate_podcast.py",
    "Graphical Abstract": "generate_graphical_abstract.py",
    "Video": "generate_video.py",
  };

  const scriptName = scriptMap[outputType];
  if (!scriptName) {
    return res.status(400).json({ error: "Invalid output type." });
  }

  const pathToPythonScript = path.join(scriptsDir, scriptName);
  console.log(`Executing script: ${scriptName} for output type: ${outputType}`);

  // For PPT, send the response after 30 seconds, but execute the script immediately
  if (outputType === "PPT") {
    // Send success response after 20 seconds
    setTimeout(() => {
      res.json({ message: `${outputType} generation started successfully`, status: "Processing" });
    }, 20000); // Wait for 20 seconds before responding

    // Execute the Python script in the background immediately
    if (!fs.existsSync(pathToPythonScript)) {
      console.error(`Script ${scriptName} not found.`);
    } else {
      exec(`python "${pathToPythonScript}" "${uploadedFilePath}"`, (error, stdout, stderr) => {
        if (error || stderr) {
          console.error("Error processing file:", error || stderr);
        } else {
          console.log(`Python script (${scriptName}) output:`, stdout);
        }
      });
    }

    return; // Exit here to prevent the second response being sent before timeout
  }

  // For other output types, handle normally (without delay)
  // Check if the script exists
  if (!fs.existsSync(pathToPythonScript)) {
    return res.status(500).json({ error: `Script ${scriptName} not found.` });
  }

  // Execute the corresponding Python script
  exec(`python "${pathToPythonScript}" "${uploadedFilePath}"`, (error, stdout, stderr) => {
    if (error || stderr) {
      console.error("Error processing file:", error || stderr);
      return res.status(500).json({ error: "Error processing file." });
    }

    console.log(`Python script (${scriptName}) output:`, stdout);
    res.json({ message: `${outputType} generated successfully`, outputFile: `output_${outputType.toLowerCase()}.mp4` });
  });
});

// Start the backend server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
