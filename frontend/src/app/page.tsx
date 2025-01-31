"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";

interface FileWithName extends File {
  name: string;
}

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<FileWithName[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileWithName[]>([]);
  const [outputType, setOutputType] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setSelectedFiles(files);
    }
  };

  const handleOutputChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setOutputType(event.target.value);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || outputType === "") return;

    setUploading(true);
    setUploadStatus("Uploading...");

    const formData = new FormData();
    formData.append("file", selectedFiles[0]);
    formData.append("outputType", outputType);

    try {
      const response = await axios.post("http://localhost:5000/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUploadedFiles([selectedFiles[0]]);
      setUploadStatus("Upload Successful. Processing...");
      setUploading(false);
      console.log(response.data);
    } catch (error) {
      console.error("Error during upload:", error);
      setUploadStatus("Upload failed.");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
      <Card className="w-full max-w-2xl p-8 text-center bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Upload Your Research Paper</h1>
        <CardContent>
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-400 p-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <Upload className="h-10 w-10 text-gray-600 mb-3" />
            <span className="text-lg font-medium">
              Drag & drop files or <span className="text-blue-500">Browse</span>
            </span>
            <input
              id="file-upload"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* ✅ Display selected file name */}
          {selectedFiles.length > 0 && (
            <div className="mt-4 text-gray-700 font-medium bg-green-100 p-2 rounded-md">
              Selected File: {selectedFiles[0].name}
            </div>
          )}

          <div className="mt-6">
            <label className="text-gray-700 font-medium" htmlFor="output-type">
              Select Output Type:
            </label>
            <select
              id="output-type"
              className="mt-2 p-2 border rounded-md text-gray-700"
              value={outputType}
              onChange={handleOutputChange}
            >
              <option value="">Select Output</option>
              <option value="PPT">PPT (Formal or Fun)</option>
              <option value="Podcast">Podcast (Short/Long, Multilingual)</option>
              <option value="Graphical Abstract">Graphical Abstract</option>
              <option value="Video">Video (Reel/YouTube Explainer)</option>
            </select>
          </div>

          {uploading && <p className="mt-4 text-gray-700 font-medium">{uploadStatus}</p>}
          {uploadStatus && !uploading && <p className="mt-4 text-green-500 font-medium">{uploadStatus}</p>}

          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || outputType === "" || uploading}
            >
              Upload & Process
            </Button>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-6 text-gray-700">
              <h2 className="font-bold">Uploaded Files:</h2>
              <ul className="mt-2">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="bg-green-100 p-2 rounded-md mt-2">{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
