const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

// Configure file upload destination
const upload = multer({ dest: path.join(__dirname, "../uploads") });

// API for file upload
router.post("/upload", upload.single("file"), (req, res) => {
  const { outputType } = req.body;
  const filePath = path.join(__dirname, "../uploads", req.file.filename);

  // Process the file based on the output type
  let pythonScript = "";
  switch (outputType) {
    case "PPT":
      pythonScript = path.join(__dirname, "../scripts/generate_ppt.py");
      break;
    case "Podcast":
      pythonScript = path.join(__dirname, "../scripts/generate_podcast.py");
      break;
    case "Graphical Abstract":
      pythonScript = path.join(__dirname, "../scripts/generate_graphical_abstract.py");
      break;
    case "Video":
      pythonScript = path.join(__dirname, "../scripts/generate_video.py");
      break;
    default:
      return res.status(400).send("Invalid output type.");
  }

  // Execute the Python script
  const exec = require("child_process").exec;
  exec(`python ${pythonScript} --file ${filePath}`, (err, stdout, stderr) => {
    if (err || stderr) {
      return res.status(500).send("Error processing file.");
    }

    res.json({ message: "Processing successful", outputFile: stdout });
  });
});

module.exports = router;
