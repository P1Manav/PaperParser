"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, Settings, Save } from "lucide-react"
import { getUserGenerations } from "@/lib/api" // Update import

interface ProfileProps {
  user: any
  onClose: () => void
}

export function Profile({ user, onClose }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    displayName: user?.user_metadata?.full_name || "",
    email: user?.email || "",
  })
  const [stats, setStats] = useState({ podcasts: 0, presentations: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserStats = async () => {
      if (user?.id) {
        try {
          const generations = await getUserGenerations(user.id) // Use API function
          const podcasts = generations.filter((g) => g.type === "podcast").length
          const presentations = generations.filter((g) => g.type === "presentation").length
          setStats({ podcasts, presentations })
        } catch (error) {
          console.error("Error loading user stats:", error)
        }
      }
      setLoading(false)
    }

    loadUserStats()
  }, [user])

  const handleSave = async () => {
    // Here you would update the user profile in Supabase
    console.log("Saving profile:", formData)
    setIsEditing(false)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Avatar className="h-20 w-20 mx-auto mb-4">
                <AvatarImage
                  src={user?.user_metadata?.avatar_url || "/placeholder.svg"}
                  alt={user?.user_metadata?.full_name}
                />
                <AvatarFallback className="text-lg">
                  {user?.user_metadata?.full_name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl">{user?.user_metadata?.full_name}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500">Display Name</p>
                    <p className="font-medium">{user?.user_metadata?.full_name}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium">{user?.created_at ? formatDate(user.created_at) : "Recently joined"}</p>
              </div>
            </div>
          </div>

          {/* Account Stats */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Account Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{loading ? "..." : stats.podcasts}</p>
                <p className="text-sm text-gray-500">Podcasts</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{loading ? "..." : stats.presentations}</p>
                <p className="text-sm text-gray-500">Presentations</p>
              </div>
            </div>
          </div>

          {/* Account Type */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Account Type</span>
              <Badge variant="secondary">Free</Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)} className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
