"use client"

import { useUser } from "@clerk/nextjs"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserMenu } from "@/components/layout/user-menu"
import { RepositoryList } from "@/components/repos/repository-list"
import { GitMerge } from "lucide-react"

export default function Dashboard() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">PatchCanvas</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {user?.firstName || user?.username}!
            </h1>
            <p className="text-muted-foreground">
              Select a repository to get started with visual Git review.
            </p>
          </div>
          
          <RepositoryList />
        </div>
      </main>
    </div>
  )
}
