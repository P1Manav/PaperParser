const express = require("express");
const multer = require("multer");
const path = require("path");
const { exec } = require("child_process");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");
const scriptsDir = path.join(__dirname, "scripts");
const outputDir = path.join(__dirname, "outputs");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(scriptsDir)) fs.mkdirSync(scriptsDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

app.use("/outputs", express.static(outputDir));

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

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const uploadedFilePath = path.join(uploadDir, req.file.filename);
  const { outputType } = req.body;

  if (!outputType) {
    return res.status(400).json({ error: "Output type is required." });
  }

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
  const outputFileName = outputType === "PPT"
    ? "generated_presentation.pptx"
    : outputType === "Podcast"
      ? "final_conversation.mp3"
      : `output_${Date.now()}_${outputType.toLowerCase()}.pdf`;

  const outputFilePath = path.join(outputDir, outputFileName);

  if (!fs.existsSync(pathToPythonScript)) {
    return res.status(500).json({ error: `Script ${scriptName} not found.` });
  }

  console.log(`Executing ${scriptName} for ${outputType}...`);

  exec(`python "${pathToPythonScript}" "${uploadedFilePath}" "${outputFilePath}"`, (error, stdout, stderr) => {
    if (error || stderr) {
      console.error("Script error:", error || stderr);
      return res.status(500).json({ error: "Error running Python script." });
    }

    console.log(`Script output:\n${stdout}`);

    const downloadUrl = `http://localhost:5000/outputs/${outputFileName}`;

    return res.json({
      message: `${outputType} generated successfully`,
      downloadUrl: downloadUrl,
    });
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
