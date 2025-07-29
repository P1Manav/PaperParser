"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Play, Headphones, Presentation, Search, Calendar, Trash2, Eye } from "lucide-react"

interface HistoryItem {
  id: string
  title: string
  type: "podcast" | "presentation"
  createdAt: string
  status: "completed" | "processing" | "failed"
  originalFile: string
  outputFile?: string
  duration?: string
  slides?: number
  settings: {
    voice?: string
    length: string
    style?: string
    template?: string
  }
}

interface DashboardProps {
  user: any
}

export function DashboardSection({ user }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "podcast" | "presentation">("all")
  const [history, setHistory] = useState<HistoryItem[]>([])

  // Simulate loading history from Firebase
  useEffect(() => {
    const mockHistory: HistoryItem[] = [
      {
        id: "1",
        title: "Machine Learning in Healthcare",
        type: "podcast",
        createdAt: "2025-01-29T10:30:00Z",
        status: "completed",
        originalFile: "ml-healthcare.pdf",
        outputFile: "ml-healthcare-podcast.mp3",
        duration: "18:45",
        settings: {
          voice: "Sarah",
          length: "medium",
        },
      },
      {
        id: "2",
        title: "Climate Change Impact Study",
        type: "presentation",
        createdAt: "2025-01-28T14:15:00Z",
        status: "completed",
        originalFile: "climate-study.pdf",
        outputFile: "climate-study-presentation.pptx",
        slides: 15,
        settings: {
          length: "medium",
          style: "formal",
          template: "academic",
        },
      },
      {
        id: "3",
        title: "Quantum Computing Basics",
        type: "podcast",
        createdAt: "2025-01-27T09:20:00Z",
        status: "processing",
        originalFile: "quantum-computing.pdf",
        settings: {
          voice: "David",
          length: "long",
        },
      },
      {
        id: "4",
        title: "Neural Networks Research",
        type: "presentation",
        createdAt: "2025-01-26T16:45:00Z",
        status: "completed",
        originalFile: "neural-networks.pdf",
        outputFile: "neural-networks-presentation.pptx",
        slides: 22,
        settings: {
          length: "long",
          style: "informal",
          template: "modern",
        },
      },
    ]
    setHistory(mockHistory)
  }, [])

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || item.type === filterType
    return matchesSearch && matchesFilter
  })

  const handleDownload = (item: HistoryItem) => {
    // Simulate download from Firebase Storage
    console.log(`Downloading ${item.outputFile}`)
  }

  const handleDelete = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
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
                <div className="text-2xl font-bold">{history.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Podcasts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {history.filter((item) => item.type === "podcast").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Presentations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {history.filter((item) => item.type === "presentation").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {history.filter((item) => item.status === "processing").length}
                </div>
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
                            <div className="text-sm text-gray-500">{item.originalFile}</div>
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
                            {formatDate(item.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.type === "podcast" && item.duration && <div>Duration: {item.duration}</div>}
                            {item.type === "presentation" && item.slides && <div>{item.slides} slides</div>}
                            <div className="text-gray-500">
                              {item.settings.voice && `Voice: ${item.settings.voice} • `}
                              Length: {item.settings.length}
                              {item.settings.style && ` • Style: ${item.settings.style}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {item.status === "completed" && (
                              <>
                                {item.type === "podcast" && (
                                  <Button variant="ghost" size="sm">
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                                {item.type === "presentation" && (
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="sm" onClick={() => handleDownload(item)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-700"
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
