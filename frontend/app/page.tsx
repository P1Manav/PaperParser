"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  Mic,
  FileText,
  Download,
  Play,
  Volume2,
  Presentation,
  Headphones,
  Sparkles,
  Zap,
  Target,
} from "lucide-react"
import { DashboardSection } from "@/components/dashboard"
import { Navigation } from "@/components/navigation"
import { FileUpload } from "@/components/file-upload"

interface GenerationResult {
  type: "podcast" | "presentation"
  title: string
  duration?: string
  slides?: number
  downloadUrl: string
  previewUrl?: string
}

export default function PaperParserLanding() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<GenerationResult[]>([])
  const [activeTab, setActiveTab] = useState("podcast")
  const [user, setUser] = useState<any>(null)
  const [showDashboard, setShowDashboard] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleLogin = () => {
    setUser({
      name: "John Doe",
      email: "john@example.com",
      photoURL: "/placeholder.svg?height=40&width=40",
    })
  }

  const handleLogout = () => {
    setUser(null)
    setShowDashboard(false)
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
  }

  const simulateFileUpload = async () => {
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i)
      await new Promise((resolve) => setTimeout(resolve, 200))
    }

    setIsUploading(false)
    setUploadProgress(0)
  }

  const handleGenerate = async (type: "podcast" | "presentation", formData: any) => {
    if (!selectedFile) {
      alert("Please upload a PDF file first.")
      return
    }

    setIsGenerating(true)

    // Simulate file upload first
    await simulateFileUpload()

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const newResult: GenerationResult = {
      type,
      title: formData.title || selectedFile.name.replace(".pdf", ""),
      duration: type === "podcast" ? "15:30" : undefined,
      slides: type === "presentation" ? 12 : undefined,
      downloadUrl: `#download-${type}`,
      previewUrl: type === "podcast" ? "#audio-preview" : "#presentation-preview",
    }

    setResults((prev) => [newResult, ...prev])
    setIsGenerating(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <Navigation
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
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
                <Button onClick={handleLogin} size="lg" className="flex items-center gap-3 mx-auto">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Get Started with Google
                </Button>
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
                      <CardTitle>🎧 Podcast Generation</CardTitle>
                      <CardDescription>Convert papers into audio podcasts</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-500" />
                      Multiple voice options
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      Customizable length (Short, Medium, Long)
                    </li>
                    <li className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-green-500" />
                      High-quality audio output
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
                      <CardTitle>📊 Presentation Creation</CardTitle>
                      <CardDescription>Generate PowerPoint presentations</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-500" />
                      Formal or informal styles
                    </li>
                    <li className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      Multiple length options
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-500" />
                      Professional templates
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
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="voice-select">Voice Selection</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a voice" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sarah">Sarah (Female, Professional)</SelectItem>
                                  <SelectItem value="david">David (Male, Warm)</SelectItem>
                                  <SelectItem value="emma">Emma (Female, Energetic)</SelectItem>
                                  <SelectItem value="james">James (Male, Authoritative)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="podcast-length">Podcast Length</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select length" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="short">Short (5-10 minutes)</SelectItem>
                                  <SelectItem value="medium">Medium (15-25 minutes)</SelectItem>
                                  <SelectItem value="long">Long (30-45 minutes)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="podcast-title">Podcast Title (Optional)</Label>
                            <Input placeholder="Enter custom title for your podcast" />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="focus-areas">Focus Areas (Optional)</Label>
                            <Textarea placeholder="Specify particular sections or topics to emphasize..." />
                          </div>

                          <Button
                            onClick={() => handleGenerate("podcast", { title: "Research Paper Podcast" })}
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
                              <Label htmlFor="presentation-style">Presentation Style</Label>
                              <Select>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose style" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="formal">Formal (Academic/Professional)</SelectItem>
                                  <SelectItem value="informal">Informal (Casual/Accessible)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="presentation-length">Presentation Length</Label>
                              <Select>
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

                          <div className="space-y-2">
                            <Label htmlFor="template-choice">Template Choice</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose template" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="modern">Modern (Clean & Minimal)</SelectItem>
                                <SelectItem value="academic">Academic (Traditional)</SelectItem>
                                <SelectItem value="creative">Creative (Colorful)</SelectItem>
                                <SelectItem value="corporate">Corporate (Professional)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="presentation-title">Presentation Title (Optional)</Label>
                            <Input placeholder="Enter custom title for your presentation" />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="key-points">Key Points to Highlight (Optional)</Label>
                            <Textarea placeholder="Specify important findings or sections to emphasize..." />
                          </div>

                          <Button
                            onClick={() => handleGenerate("presentation", { title: "Research Paper Presentation" })}
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
                      <Card key={index} className="border-2">
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
                                    ? `Duration: ${result.duration}`
                                    : `${result.slides} slides`}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge variant={result.type === "podcast" ? "default" : "secondary"}>
                              {result.type === "podcast" ? "Podcast" : "Presentation"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-3">
                            {result.type === "podcast" && (
                              <Button variant="outline" size="sm">
                                <Play className="h-4 w-4 mr-2" />
                                Preview Audio
                              </Button>
                            )}
                            {result.type === "presentation" && (
                              <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-2" />
                                Preview Slides
                              </Button>
                            )}
                            <Button size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Download {result.type === "podcast" ? "MP3" : "PPTX"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
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
                href="https://github.com/yourusername/paperparser"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </a>
              <a
                href="https://linkedin.com/in/yourusername"
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
                href="mailto:your.email@example.com"
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
