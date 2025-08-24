"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Upload, Mic, FileText, Download, Volume2, Presentation, Headphones, Sparkles, Zap, Target } from "lucide-react"
import { DashboardSection } from "@/components/dashboard"
import { Navigation } from "@/components/navigation"
import { FileUpload } from "@/components/file-upload"
import { onAuthStateChanged, isSupabaseConfigured } from "@/lib/supabase-safe"
import { generateContent as apiGenerateContent, pollGenerationStatus, type GenerationStatus } from "@/lib/api"
import { SetupRequired } from "@/components/setup-required"

interface GenerationResult {
  type: "podcast" | "presentation"
  title: string
  duration?: string
  slides?: number
  downloadUrl: string
  previewUrl?: string
  Alex_voice?: string
  Avery_voice?: string
  quality?: string
  template?: string
  length?: string
}

export default function PaperParserLanding() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("podcast")
  const [user, setUser] = useState<any>(null)
  const [showDashboard, setShowDashboard] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null)
  const [previewingItem, setPreviewingItem] = useState<any>(null)
  const [uploadProgress, setUploadProgress] = useState(0) // Declare uploadProgress variable

  // Form states - simplified to only required fields
  const [podcastSettings, setPodcastSettings] = useState({
    AlexVoice: "",
    AveryVoice: "",
    quality: "",
  })

  const [presentationSettings, setPresentationSettings] = useState({
    template: "",
    length: "",
  })

  useEffect(() => {
    const {
      data: { subscription },
    } = onAuthStateChanged((user) => {
      setUser(user)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
  }

  const handleGenerate = async (type: "podcast" | "presentation") => {
    if (!selectedFile || !user) {
      alert("Please upload a PDF file and sign in first.")
      return
    }

    const settings = type === "podcast" ? podcastSettings : presentationSettings
    type PodcastSettings = { AlexVoice: string; AveryVoice: string; quality: string };
    type PresentationSettings = { template: string; length: string };
    type Settings = PodcastSettings | PresentationSettings;
    if (type === "podcast") {
      const podcastSettings = settings as PodcastSettings;
      if (!podcastSettings.AlexVoice || !podcastSettings.AveryVoice || !podcastSettings.quality) {
        alert("Please select Alex voice, Avery voice, and quality for your podcast.");
        return;
      }
    }

    if (type === "presentation") {
      const presentationSettings = settings as PresentationSettings;
      if (!presentationSettings.template || !presentationSettings.length) {
        alert("Please select template and length for your presentation.");
        return;
      }
    }

    setIsGenerating(true)
    setIsUploading(true)

    try {
      // Call backend to start generation
      const response = await apiGenerateContent({
        file: selectedFile,
        outputType: type === "podcast" ? "Podcast" : "presentation",
        settings,
        userId: user.id,
      })

      const newGenerationId = response.generationId
      setCurrentGenerationId(newGenerationId)

      // Add a placeholder to results immediately
      const newResultPlaceholder: GenerationResult & { id: string; status: string } = {
        id: newGenerationId,
        type,
        title: selectedFile.name.replace(".pdf", ""),
        downloadUrl: "",
        status: "processing",
        ...settings,
      }
      setResults((prev) => [newResultPlaceholder, ...prev])

      setIsUploading(false)

      // Start polling for status updates
      const finalStatus = await pollGenerationStatus(newGenerationId, (statusUpdate: GenerationStatus) => {
        // Update the specific item in results with the latest status
        setResults((prev) => prev.map((item) => (item.id === statusUpdate.id ? { ...item, ...statusUpdate } : item)))
      })

      if (finalStatus.status === "completed") {
        console.log(`${type} generated successfully!`)
      } else {
        console.error(`Failed to generate ${type}: ${finalStatus.error || "Unknown error"}`)
      }

      // Reset form
      setSelectedFile(null)
      if (type === "podcast") {
        setPodcastSettings({ AlexVoice: "", AveryVoice: "", quality: "" })
      } else {
        setPresentationSettings({ template: "", length: "" })
      }
    } catch (error) {
      console.error("Generation failed:", error)
      alert("Failed to generate content. Please try again.")
      setResults((prev) => prev.filter((item) => item.id !== currentGenerationId))
    } finally {
      setIsGenerating(false)
      setUploadProgress(0)
      setCurrentGenerationId(null)
    }
  }

  const handleDownload = (result: any) => {
    if (!result.downloadUrl && !result.download_url) {
      alert("Download not available")
      return
    }

    try {
      const downloadUrl = result.downloadUrl || result.download_url
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = result.type === "podcast" ? `${result.title}.mp3` : `${result.title}.pptx`
      link.target = "_blank"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Download failed:", error)
      alert("Download failed. Please try again.")
    }
  }

  if (!isSupabaseConfigured()) {
    return <SetupRequired />
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <Navigation
        user={user}
        onShowDashboard={() => setShowDashboard(true)}
        onShowGenerate={() => setShowDashboard(false)}
        showDashboard={showDashboard}
      />

      {!showDashboard ? (
        <>
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative container mx-auto px-4 py-20">
              <div className="text-center max-w-4xl mx-auto">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <Sparkles className="h-8 w-8" />
                  <h1 className="text-5xl font-bold">PaperParser</h1>
                </div>
                <p className="text-xl mb-8 text-blue-100">
                  Transform academic research papers into accessible formats such as podcasts 🎧 and PowerPoint
                  presentations 📊
                </p>
                <p className="text-lg mb-10 text-blue-200 max-w-2xl mx-auto">
                  Leveraging advanced language models and text-to-speech technologies to make scholarly content more
                  digestible and engaging for a broader audience.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    <Headphones className="h-4 w-4 mr-2" />
                    Podcast Generation
                  </Badge>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    <Presentation className="h-4 w-4 mr-2" />
                    Presentation Creation
                  </Badge>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action for Non-Authenticated Users */}
          {!user && (
            <section className="py-12 bg-blue-50 border-b">
              <div className="container mx-auto px-4 text-center">
                <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Research?</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Sign in with Google to start converting your academic papers into engaging podcasts and presentations.
                  Your generated content will be saved to your personal dashboard.
                </p>
              </div>
            </section>
          )}

          {/* Features Overview */}
          <section className="py-16 container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">🚀 Features</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Choose how you want to consume academic content - listen on the go or present with style
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card className="border-2 hover:border-blue-200 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Headphones className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle> Podcast Generation</CardTitle>
                      <CardDescription>Convert papers into audio podcasts</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-500" />
                      Multiple Google Gemini voices for Alex and Avery
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      High and low quality options
                    </li>
                    <li className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-green-500" />
                      Natural conversation format
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-purple-200 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Presentation className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle> Presentation Creation</CardTitle>
                      <CardDescription>Generate PowerPoint presentations</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-500" />
                      20 professional templates
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      Multiple length options
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-500" />
                      Academic formatting
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Main Generation Interface - Only show if user is logged in */}
          {user && (
            <section className="py-16 bg-gray-50">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold mb-4">Start Converting Your Paper</h2>
                    <p className="text-gray-600">Upload your academic paper and choose your preferred output format</p>
                  </div>

                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Upload Academic Paper
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FileUpload
                        onFileSelect={handleFileSelect}
                        selectedFile={selectedFile}
                        onFileRemove={handleFileRemove}
                        isUploading={isUploading}
                        uploadProgress={uploadProgress}
                      />
                    </CardContent>
                  </Card>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="podcast" className="flex items-center gap-2">
                        <Headphones className="h-4 w-4" />
                        Podcast
                      </TabsTrigger>
                      <TabsTrigger value="presentation" className="flex items-center gap-2">
                        <Presentation className="h-4 w-4" />
                        Presentation
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="podcast">
                      <Card>
                        <CardHeader>
                          <CardTitle>🎧 Podcast Generation Settings</CardTitle>
                          <CardDescription>Customize your audio podcast preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="Alex-voice">Alex Voice</Label>
                              <Select
                                value={podcastSettings.AlexVoice}
                                onValueChange={(value) => setPodcastSettings({ ...podcastSettings, AlexVoice: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose Alex's voice" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Zephyr">Zephyr (Bright)</SelectItem>
                                  <SelectItem value="Puck">Puck (Upbeat)</SelectItem>
                                  <SelectItem value="Charon">Charon (Informative)</SelectItem>
                                  <SelectItem value="Kore">Kore (Firm)</SelectItem>
                                  <SelectItem value="Fenrir">Fenrir (Excitable)</SelectItem>
                                  <SelectItem value="Leda">Leda (Youthful)</SelectItem>
                                  <SelectItem value="Orus">Orus (Firm)</SelectItem>
                                  <SelectItem value="Aoede">Aoede (Breezy)</SelectItem>
                                  <SelectItem value="Callirrhoe">Callirrhoe (Easy-going)</SelectItem>
                                  <SelectItem value="Autonoe">Autonoe (Bright)</SelectItem>
                                  <SelectItem value="Enceladus">Enceladus (Breathy)</SelectItem>
                                  <SelectItem value="Iapetus">Iapetus (Clear)</SelectItem>
                                  <SelectItem value="Umbriel">Umbriel (Easy-going)</SelectItem>
                                  <SelectItem value="Algieba">Algieba (Smooth)</SelectItem>
                                  <SelectItem value="Despina">Despina (Smooth)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="Avery-voice">Avery Voice</Label>
                              <Select
                                value={podcastSettings.AveryVoice}
                                onValueChange={(value) => setPodcastSettings({ ...podcastSettings, AveryVoice: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose Avery's voice" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Erinome">Erinome (Clear)</SelectItem>
                                  <SelectItem value="Algenib">Algenib (Gravelly)</SelectItem>
                                  <SelectItem value="Rasalgethi">Rasalgethi (Informative)</SelectItem>
                                  <SelectItem value="Laomedeia">Laomedeia (Upbeat)</SelectItem>
                                  <SelectItem value="Achernar">Achernar (Soft)</SelectItem>
                                  <SelectItem value="Alnilam">Alnilam (Firm)</SelectItem>
                                  <SelectItem value="Schedar">Schedar (Even)</SelectItem>
                                  <SelectItem value="Gacrux">Gacrux (Mature)</SelectItem>
                                  <SelectItem value="Pulcherrima">Pulcherrima (Forward)</SelectItem>
                                  <SelectItem value="Achird">Achird (Friendly)</SelectItem>
                                  <SelectItem value="Zubenelgenubi">Zubenelgenubi (Casual)</SelectItem>
                                  <SelectItem value="Vindemiatrix">Vindemiatrix (Gentle)</SelectItem>
                                  <SelectItem value="Sadachbia">Sadachbia (Lively)</SelectItem>
                                  <SelectItem value="Sadaltager">Sadaltager (Knowledgeable)</SelectItem>
                                  <SelectItem value="Sulafat">Sulafat (Warm)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="quality-select">Audio Quality</Label>
                              <Select
                                value={podcastSettings.quality}
                                onValueChange={(value) => setPodcastSettings({ ...podcastSettings, quality: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose quality" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="high">High Quality (Gemini TTS)</SelectItem>
                                  <SelectItem value="low">Low Quality (Edge TTS)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleGenerate("podcast")}
                            disabled={isGenerating || !selectedFile}
                            className="w-full"
                            size="lg"
                          >
                            {isGenerating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                {isUploading ? "Uploading..." : "Generating Podcast..."}
                              </>
                            ) : (
                              <>
                                <Mic className="h-4 w-4 mr-2" />
                                Generate Podcast
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="presentation">
                      <Card>
                        <CardHeader>
                          <CardTitle>📊 Presentation Generation Settings</CardTitle>
                          <CardDescription>Customize your PowerPoint presentation</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="template-number">Template Number</Label>
                              <Select
                                value={presentationSettings.template}
                                onValueChange={(value) =>
                                  setPresentationSettings({ ...presentationSettings, template: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose template (1-20)" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
                                    <SelectItem key={num} value={num.toString()}>
                                      Template {num}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="presentation-length">Presentation Length</Label>
                              <Select
                                value={presentationSettings.length}
                                onValueChange={(value) =>
                                  setPresentationSettings({ ...presentationSettings, length: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select length" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="short">Short (5-8 slides)</SelectItem>
                                  <SelectItem value="medium">Medium (10-15 slides)</SelectItem>
                                  <SelectItem value="long">Long (20-30 slides)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleGenerate("presentation")}
                            disabled={isGenerating || !selectedFile}
                            className="w-full"
                            size="lg"
                          >
                            {isGenerating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                {isUploading ? "Uploading..." : "Generating Presentation..."}
                              </>
                            ) : (
                              <>
                                <FileText className="h-4 w-4 mr-2" />
                                Generate Presentation
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </section>
          )}

          {/* Results Section */}
          {results.length > 0 && user && (
            <section className="py-16">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-3xl font-bold text-center mb-8">Your Generated Content</h2>

                  <div className="space-y-6">
                    {results.map((result, index) => (
                      <div key={result.id}>
                        <Card className="border-2">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2 rounded-lg ${result.type === "podcast" ? "bg-blue-100" : "bg-purple-100"}`}
                                >
                                  {result.type === "podcast" ? (
                                    <Headphones className="h-6 w-6 text-blue-600" />
                                  ) : (
                                    <Presentation className="h-6 w-6 text-purple-600" />
                                  )}
                                </div>
                                <div>
                                  <CardTitle>{result.title}</CardTitle>
                                  <CardDescription>
                                    {result.type === "podcast"
                                      ? "Podcast"
                                      : `${result.slides || result.slide_count || "N/A"} slides`}
                                  </CardDescription>
                                </div>
                              </div>
                              {/* Display status badge */}
                              {result.status === "processing" && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-800 mr-1"></div>
                                  Processing
                                </Badge>
                              )}
                              {result.status === "completed" && (
                                <Badge
                                  variant={result.type === "podcast" ? "default" : "secondary"}
                                  className="bg-green-100 text-green-800"
                                >
                                  Completed
                                </Badge>
                              )}
                              {result.status === "failed" && <Badge variant="destructive">Failed</Badge>}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {/* Display detailed information based on content type */}
                              {result.type === "presentation" && (
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Pages:</span>
                                    <span>
                                      {result.length === "short" && "5-8 slides"}
                                      {result.length === "medium" && "10-15 slides"}
                                      {result.length === "long" && "20-30 slides"}
                                      {!result.length && `${result.slides || result.slide_count || "N/A"} slides`}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Template:</span>
                                    <span>Template {result.template || "N/A"}</span>
                                  </div>
                                </div>
                              )}

                              {result.type === "podcast" && (
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Alex Voice:</span>
                                    <span>{result.Alex_voice || result.AlexVoice || "N/A"}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Avery Voice:</span>
                                    <span>{result.Avery_voice || result.AveryVoice || "N/A"}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Audio Quality:</span>
                                    <span className="capitalize">{result.quality || "N/A"}</span>
                                  </div>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-3 pt-2">
                                {result.status === "completed" && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleDownload(result)}
                                      disabled={!result.downloadUrl && !result.download_url}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Download {result.type === "podcast" ? "MP3" : "PPTX"}
                                    </Button>
                                  </>
                                )}
                                {result.status === "failed" && (
                                  <p className="text-sm text-red-600">Error: {result.error || "Generation failed."}</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      ) : (
        <DashboardSection user={user} />
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6" />
              <h3 className="text-2xl font-bold">PaperParser</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Transform academic research papers into accessible podcasts and presentations using AI
            </p>
            <div className="flex justify-center gap-6 mb-6">
              <a
                href="https://github.com/P1Manav"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.85 3.37 1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.414v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                GitHub
              </a>
              <a
                href="https://www.linkedin.com/in/manavdprajapati/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
              <a
                href="mailto:maxprajapati606@gmail.com"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email
              </a>
            </div>
            <p className="text-gray-500 text-sm">© 2025 PaperParser. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
