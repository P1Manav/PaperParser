"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Headphones, Presentation, Search, Calendar, Trash2 } from "lucide-react"
import { getUserGenerations, deleteGeneration, type GenerationStatus } from "@/lib/api"

interface DashboardProps {
  user: any
}

export function DashboardSection({ user }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "podcast" | "presentation">("all")
  const [history, setHistory] = useState<GenerationStatus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadUserGenerations()
    }
  }, [user])

  const loadUserGenerations = async () => {
    try {
      setLoading(true)
      const generations = await getUserGenerations(user.id)
      setHistory(generations)
    } catch (error) {
      console.error("Error loading generations:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || item.type === filterType
    return matchesSearch && matchesFilter
  })

  const handleDownload = async (item: GenerationStatus) => {
    try {
      if (!item.download_url) {
        alert("Download URL not available")
        return
      }

      // Create a temporary link to download the file
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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this generation?")) {
      return
    }

    try {
      await deleteGeneration(id, user.id)
      setHistory((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      console.error("Delete failed:", error)
      alert("Delete failed. Please try again.")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const stats = {
    total: history.length,
    podcasts: history.filter((item) => item.type === "podcast").length,
    presentations: history.filter((item) => item.type === "presentation").length,
    processing: history.filter((item) => item.status === "processing").length,
  }

  if (loading) {
    return (
      <section className="py-16 bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-gray-600">Manage your generated podcasts and presentations</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Generated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Podcasts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.podcasts}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Presentations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.presentations}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.processing}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Generation History</CardTitle>
              <CardDescription>View and manage all your generated content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterType === "all" ? "default" : "outline"}
                    onClick={() => setFilterType("all")}
                    size="sm"
                  >
                    All
                  </Button>
                  <Button
                    variant={filterType === "podcast" ? "default" : "outline"}
                    onClick={() => setFilterType("podcast")}
                    size="sm"
                  >
                    <Headphones className="h-4 w-4 mr-1" />
                    Podcasts
                  </Button>
                  <Button
                    variant={filterType === "presentation" ? "default" : "outline"}
                    onClick={() => setFilterType("presentation")}
                    size="sm"
                  >
                    <Presentation className="h-4 w-4 mr-1" />
                    Presentations
                  </Button>
                </div>
              </div>

              {/* History Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-gray-500">{item.original_file_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.type === "podcast" ? (
                              <Headphones className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Presentation className="h-4 w-4 text-purple-600" />
                            )}
                            <span className="capitalize">{item.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {formatDate(item.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.type === "presentation" && (
                              <div>
                                {/* Show pages based on length */}
                                {item.settings?.length === "short" && <div>Pages: 5-8 slides</div>}
                                {item.settings?.length === "medium" && <div>Pages: 10-15 slides</div>}
                                {item.settings?.length === "long" && <div>Pages: 20-30 slides</div>}
                                {!item.settings?.length && item.slides && <div>{item.slides} slides</div>}
                                {!item.settings?.length && !item.slides && <div>Slides: N/A</div>}
                                {/* Show template number */}
                                {item.settings?.template && <div>Template: {item.settings.template}</div>}
                              </div>
                            )}
                            {item.type === "podcast" && (
                              <div>
                                {item.settings?.AlexVoice && <div>Alex Voice: {item.settings.AlexVoice}</div>}
                                {item.settings?.AveryVoice && <div>Avery Voice: {item.settings.AveryVoice}</div>}
                                {item.settings?.quality && (
                                  <div>
                                    Quality: {item.settings.quality === "high" ? "High (Gemini TTS)" : "Low (Edge TTS)"}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.status === "completed" && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleDownload(item)} title="Download">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm || filterType !== "all"
                    ? "No items match your search criteria"
                    : "No generated content yet. Start by uploading a paper!"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
