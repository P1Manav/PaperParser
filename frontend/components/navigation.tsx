"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sparkles, User, LayoutDashboard, LogOut, ChevronDown } from "lucide-react"
import { signInWithGoogle, signOutUser } from "@/lib/supabase-safe"
import { Profile } from "./profile"

interface NavigationProps {
  user: any
  onShowDashboard: () => void
  onShowGenerate: () => void
  showDashboard: boolean
}

export function Navigation({ user, onShowDashboard, onShowGenerate, showDashboard }: NavigationProps) {
  const [showProfile, setShowProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      // The redirect will be handled by Supabase
    } catch (error) {
      console.error("Login failed:", error)
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOutUser()
      // The user state will be updated through onAuthStateChanged in the main component
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={onShowGenerate}>
              <Sparkles className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">PaperParser</h1>
            </div>

            {/* Navigation Links (when logged in) */}
            {user && (
              <nav className="hidden md:flex items-center gap-6 mx-auto">
                <Button variant={!showDashboard ? "default" : "ghost"} onClick={onShowGenerate} className="text-sm">
                  Generate
                </Button>
                <Button variant={showDashboard ? "default" : "ghost"} onClick={onShowDashboard} className="text-sm">
                  Dashboard
                </Button>
              </nav>
            )}

            {/* Authentication */}
            <div className="flex items-center gap-4">
              {!user ? (
                <Button onClick={handleLogin} disabled={isLoading} className="flex items-center gap-3">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
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
                  )}
                  Sign in with Google
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 h-10">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                          alt={user.user_metadata?.full_name}
                        />
                        <AvatarFallback>
                          {user.user_metadata?.full_name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:flex flex-col items-start">
                        <span className="text-sm font-medium">{user.user_metadata?.full_name}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={user.user_metadata?.avatar_url || "/placeholder.svg"}
                          alt={user.user_metadata?.full_name}
                        />
                        <AvatarFallback>
                          {user.user_metadata?.full_name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.user_metadata?.full_name}</span>
                        <span className="text-xs text-gray-500">{user.email}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowProfile(true)} className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onShowDashboard} className="cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfile && <Profile user={user} onClose={() => setShowProfile(false)} />}
    </>
  )
}
