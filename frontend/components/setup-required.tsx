"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ExternalLink, AlertTriangle, Copy, Check } from "lucide-react"
import { useState } from "react"

export function SetupRequired() {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const envTemplate = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000`

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <CardTitle className="text-2xl">Setup Required</CardTitle>
            </div>
            <CardDescription>
              Supabase environment variables are missing. Please complete the setup to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                The following environment variables are required: <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quick Setup Steps:</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Create a Supabase Project</p>
                    <p className="text-sm text-gray-600">
                      Go to{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-blue-600"
                        onClick={() => window.open("https://supabase.com", "_blank")}
                      >
                        supabase.com
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>{" "}
                      and create a new project
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Get Your Project Credentials</p>
                    <p className="text-sm text-gray-600">Go to Project Settings → API to find your URL and anon key</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Create .env.local File</p>
                    <p className="text-sm text-gray-600 mb-2">
                      Create a <code>.env.local</code> file in your project root with:
                    </p>
                    <div className="relative">
                      <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                        <code>{envTemplate}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyToClipboard(envTemplate, "env")}
                      >
                        {copied === "env" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Restart Development Server</p>
                    <p className="text-sm text-gray-600">
                      Run <code>npm run dev</code> again to load the new environment variables
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Need Help?</h4>
              <p className="text-sm text-gray-600 mb-3">Check the detailed setup guide for complete instructions:</p>
              <Button variant="outline" onClick={() => window.open("/SUPABASE_SETUP.md", "_blank")} className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Complete Setup Guide
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
