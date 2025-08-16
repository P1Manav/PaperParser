"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"

interface ContentPreviewProps {
  item: {
    id: string
    type: "podcast" | "presentation"
    title: string
    download_url?: string
    duration?: string
    slides?: number
  }
  onClose: () => void
}

export function ContentPreview({ item, onClose }: ContentPreviewProps) {
  const handleDownload = () => {
    if (!item.download_url) {
      alert("Download not available")
      return
    }

    try {
      const link = document.createElement("a")
      link.href = item.download_url
      link.download = item.type === "podcast" ? `${item.title}.mp3` : `${item.title}.pptx`
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Download failed:", error)
      alert("Download failed. Please try again.")
    }
  }

  if (!item.download_url) {
    return (
      <Card className="mt-4 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Download Not Available</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Download is not available for this content.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-4 border-2 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {item.type === "podcast" ? "🎧 Podcast Ready" : "📊 Presentation Ready"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{item.title}</h3>
            <p className="text-sm text-gray-600">
              {item.type === "podcast" ? `Duration: ${item.duration || "N/A"}` : `${item.slides || "N/A"} slides`}
            </p>
          </div>

          <Button onClick={handleDownload} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download {item.type === "podcast" ? "MP3" : "PPTX"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
