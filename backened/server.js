const express = require("express");
const multer = require("multer");
const path = require("path");
const { exec } = require("child_process");
const cors = require("cors");
const fs = require("fs");

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Ensure directories exist
const uploadDir = path.join(__dirname, "uploads");
const scriptsDir = path.join(__dirname, "scripts");
const outputDir = path.join(__dirname, "outputs");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(scriptsDir)) fs.mkdirSync(scriptsDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// Serve the `outputs` directory as static files
app.use("/outputs", express.static(outputDir));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
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
  const outputFileName = `output_${Date.now()}_${outputType.toLowerCase()}.pdf`; // Adjust extension based on output type
  const outputFilePath = path.join(outputDir, outputFileName);

  console.log(`Executing script: ${scriptName} for output type: ${outputType}`);

  // For PPT, send an initial response after 20 seconds, then execute the script immediately
  if (outputType === "PPT") {
    // Send an initial response to let the client know that the generation has started
    setTimeout(() => {
      res.json({
        message: `${outputType} generation started successfully`,
        status: "Processing",
      });

      // Execute the Python script to generate the PPT file
      if (!fs.existsSync(pathToPythonScript)) {
        console.error(`Script ${scriptName} not found.`);
      } else {
        exec(`python "${pathToPythonScript}" "${uploadedFilePath}" "${outputFilePath}"`, (error, stdout, stderr) => {
          if (error || stderr) {
            console.error("Error processing file:", error || stderr);
          } else {
            console.log(`Python script (${scriptName}) output:`, stdout);
          }

          // After the Python script finishes, construct the download URL
          const generatedFilename = "generated_presentation.pptx"; // Assuming the PPT generation produces this file
          const downloadUrl = `http://localhost:5000/outputs/${generatedFilename}`;

          // Send the download URL response after the file is generated
          res.json({
            message: `${outputType} generated successfully`,
            downloadUrl: downloadUrl, // Direct download URL
          });
        });
      }
    }, 20000);  // Timeout of 20 seconds
    return; // Exit here to prevent second response from being sent before timeout
  }

  // For other output types, handle normally (without delay)
  if (!fs.existsSync(pathToPythonScript)) {
    return res.status(500).json({ error: `Script ${scriptName} not found.` });
  }

  // Execute the Python script for other output types
  exec(`python "${pathToPythonScript}" "${uploadedFilePath}" "${outputFilePath}"`, (error, stdout, stderr) => {
    if (error || stderr) {
      console.error("Error processing file:", error || stderr);
      return res.status(500).json({ error: "Error processing file." });
    }

    console.log(`Python script (${scriptName}) output:`, stdout);

    // Construct the correct download URL
    const generatedFilename = outputType === "PPT" ? "generated_presentation.pptx" : "final_conversation.mp3";
    const downloadUrl = `http://localhost:5000/outputs/${generatedFilename}`;

    // Send the response with the download URL after processing
    res.json({
      message: `${outputType} generated successfully`,
      downloadUrl: downloadUrl, // Send the correct file URL
    });
  });
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
