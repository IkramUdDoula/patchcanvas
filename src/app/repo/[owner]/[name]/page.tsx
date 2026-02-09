"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useRepoStore } from "@/stores/repo-store"
import { useRepositories } from "@/hooks/use-repo"
import { ContextBar } from "@/components/layout/context-bar"
import { RepoExplorer, ContentViewer } from "@/components/repo"

export default function RepositoryPage() {
  const params = useParams()
  const { selectedRepo, selectRepo, setRepositories } = useRepoStore()
  const { data: repositories = [], isLoading: isLoadingRepos } = useRepositories()
  const [isInitializing, setIsInitializing] = useState(true)
  
  const owner = params.owner as string
  const name = params.name as string

  // Sync repositories to store
  useEffect(() => {
    if (repositories.length > 0) {
      setRepositories(repositories)
    }
  }, [repositories, setRepositories])

  useEffect(() => {
    if (isLoadingRepos) return
    
    const repo = repositories.find(
      (r) => r.owner === owner && r.name === name
    )
    
    if (repo && (!selectedRepo || selectedRepo.id !== repo.id)) {
      selectRepo(repo)
    }
    
    setIsInitializing(false)
  }, [owner, name, repositories, selectedRepo, selectRepo, isLoadingRepos])

  const defaultBranch = selectedRepo?.default_branch

  if (isInitializing || isLoadingRepos || !selectedRepo || !defaultBranch) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <ContextBar showBackButton />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading repository...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ContextBar showBackButton />
      
      <div className="flex-1 flex overflow-hidden relative bg-background p-2 gap-2">
        <RepoExplorer
          owner={owner}
          repo={name}
          defaultBranch={defaultBranch}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full bg-card rounded-lg shadow-sm border border-border overflow-auto">
            <ContentViewer
              defaultBranch={defaultBranch}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
