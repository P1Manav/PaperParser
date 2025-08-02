"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react"

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // For presentation slides - we'll simulate slides since we can't directly parse PowerPoint
  const totalSlides = item.slides || 10

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleVolumeChange = () => setIsMuted(audio.muted)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("volumechange", handleVolumeChange)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("volumechange", handleVolumeChange)
    }
  }, [])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handlePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = (Number.parseFloat(e.target.value) / 100) * duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleSkip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.muted = !audio.muted
    setIsMuted(audio.muted)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => Math.min(totalSlides, prev + 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(1, prev - 1))
  }

  const goToSlide = (slideNumber: number) => {
    setCurrentSlide(slideNumber)
  }

  if (!item.download_url) {
    return (
      <Card className="mt-4 border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Preview Not Available</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Preview is not available for this content.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-4 border-2 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {item.type === "podcast" ? "🎧 Audio Player" : "📊 Presentation Viewer"}
          </CardTitle>
          <div className="flex items-center gap-2">
            {item.type === "presentation" && (
              <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {item.type === "podcast" ? (
          <div className="space-y-4">
            {/* Audio Player */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.duration}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleSkip(-10)}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button onClick={handlePlayPause} className="w-12 h-12 rounded-full">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleSkip(10)}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={toggleMute}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={duration ? (currentTime / duration) * 100 : 0}
                  onChange={handleSeek}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Hidden Audio Element */}
              <audio ref={audioRef} src={item.download_url} preload="metadata" className="hidden" />
            </div>

            {/* Playback Info */}
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                {isPlaying ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Playing
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    Paused
                  </>
                )}
              </div>
              <span>•</span>
              <span>High Quality Audio</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Presentation Viewer */}
            <div className={`bg-white border rounded-lg ${isFullscreen ? "fixed inset-4 z-50" : ""}`}>
              {/* Slide Display Area */}
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center relative">
                {/* Simulated Slide Content */}
                <div className="text-center p-8 max-w-4xl">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">{currentSlide}</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">
                      {currentSlide === 1 ? item.title : `Slide ${currentSlide}: Key Points`}
                    </h2>
                  </div>

                  {currentSlide === 1 ? (
                    <div className="space-y-4">
                      <p className="text-lg text-gray-700">Research Paper Presentation</p>
                      <div className="flex justify-center gap-4 text-sm text-gray-600">
                        <span>📊 {totalSlides} Slides</span>
                        <span>•</span>
                        <span>🎯 Academic Content</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-left">
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Key finding or methodology point {currentSlide - 1}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Supporting evidence and analysis</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Implications and conclusions</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Navigation Arrows */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevSlide}
                  disabled={currentSlide === 1}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextSlide}
                  disabled={currentSlide === totalSlides}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Slide Controls */}
              <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={prevSlide} disabled={currentSlide === 1}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm font-medium">
                      Slide {currentSlide} of {totalSlides}
                    </span>
                    <Button variant="outline" size="sm" onClick={nextSlide} disabled={currentSlide === totalSlides}>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                  <Button
                    onClick={() => window.open(item.download_url, "_blank")}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Open Full Presentation
                  </Button>
                </div>

                {/* Slide Thumbnails */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {Array.from({ length: totalSlides }, (_, i) => i + 1).map((slideNum) => (
                    <button
                      key={slideNum}
                      onClick={() => goToSlide(slideNum)}
                      className={`flex-shrink-0 w-16 h-12 border-2 rounded text-xs font-medium transition-colors ${
                        currentSlide === slideNum
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {slideNum}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Presentation Info */}
            <div className="text-center text-sm text-gray-600">
              <p>Interactive presentation preview • Use arrow keys or click thumbnails to navigate</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
