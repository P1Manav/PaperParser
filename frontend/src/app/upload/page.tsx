"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";

interface FileWithName extends File {
  name: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<FileWithName[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileWithName[]>([]);
  const [outputType, setOutputType] = useState<string>("");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null); 

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

      if (response.data.downloadUrl) {
        setDownloadUrl(response.data.downloadUrl);
        setUploadStatus("Your file is ready. Click below to download.");
      }
    } catch (error) {
      console.error("Error during upload:", error);
      setUploadStatus("Upload failed.");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-r from-green-400 to-blue-500">
      <Card className="w-full max-w-2xl p-8 text-center bg-green-100 shadow-lg rounded-lg transform transition-all hover:scale-105 hover:shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-black">Upload Your Research Paper</h1>
        <CardContent>
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-green-500 p-8 rounded-lg bg-green-200 hover:bg-green-300 text-black"
          >
            <Upload className="h-10 w-10 text-black mb-3" />
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

          {selectedFiles.length > 0 && (
            <div className="mt-4 text-black font-medium bg-green-200 p-2 rounded-md">
              Selected File: {selectedFiles[0].name}
            </div>
          )}

          <div className="mt-6">
            <label className="text-black font-medium" htmlFor="output-type">
              Select Output Type:
            </label>
            <select
              id="output-type"
              className="mt-2 p-2 border rounded-md text-black"
              value={outputType}
              onChange={handleOutputChange}
            >
              <option value="">Select Output</option>
              <option value="PPT">PPT (Formal or Fun)</option>
              <option value="Podcast">Podcast</option>
            </select>
          </div>

          {uploading && <p className="mt-4 text-black font-medium">{uploadStatus}</p>}
          {uploadStatus && !uploading && <p className="mt-4 text-black font-medium">{uploadStatus}</p>}

          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || outputType === "" || uploading}
            >
              Upload & Process
            </Button>

            {/* Home Button */}
            <Button
              className="bg-black hover:bg-black text-white font-bold py-2 px-4 rounded-lg"
              onClick={() => router.push("/")}
            >
              Home
            </Button>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-6 text-black">
              <h2 className="font-bold">Uploaded Files:</h2>
              <ul className="mt-2">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="bg-green-200 p-2 rounded-md mt-2">{file.name}</li>
                ))}
              </ul>
            </div>
          )}

          {downloadUrl && (
            <div className="mt-6 flex justify-center">
              <a
                href={downloadUrl}
                download
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg"
              >
                Download Processed File
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
