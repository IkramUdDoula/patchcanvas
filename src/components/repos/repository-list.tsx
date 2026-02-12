"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/store"
import { useRepositories } from "@/hooks/use-repo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { GitBranch, Search, Loader2 } from "lucide-react"

export function RepositoryList() {
  const router = useRouter()
  const { selectRepo } = useStore()
  const { data: repositories = [], isLoading, error, refetch } = useRepositories()
  const [search, setSearch] = useState("")

  const filteredRepos = repositories.filter((repo) =>
    repo.full_name.toLowerCase().includes(search.toLowerCase()) ||
    repo.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (repo: any) => {
    selectRepo(repo)
    router.push(`/repo/${repo.owner}/${repo.name}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    const errorData = error as any;
    const needsReauth = errorData?.needsReauth || 
                        errorData?.message?.includes('permission') ||
                        errorData?.message?.includes('scope');
    
    const handleRefresh = async () => {
      // Clear token cache before retrying
      try {
        await fetch('/api/github/refresh', { method: 'POST' });
      } catch (e) {
        console.error('Failed to refresh token:', e);
      }
      refetch();
    };
    
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <h3 className="font-semibold text-destructive mb-2">
            {needsReauth ? 'GitHub Permissions Required' : 'GitHub Connection Error'}
          </h3>
          <p className="text-sm text-destructive mb-4">
            {needsReauth 
              ? 'Your GitHub connection needs the "repo" scope to access private repositories.'
              : (error instanceof Error ? error.message : 'Failed to load repositories')
            }
          </p>
          
          {needsReauth && (
            <div className="text-sm space-y-3 mb-4">
              <p className="font-medium">To fix this, reconnect your GitHub account:</p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                <li>Click your <span className="font-medium text-foreground">profile icon</span> in the top right corner</li>
                <li>Select <span className="font-medium text-foreground">"Manage account"</span></li>
                <li>Go to the <span className="font-medium text-foreground">"Connected accounts"</span> tab</li>
                <li>Find <span className="font-medium text-foreground">GitHub</span> and click <span className="font-medium text-foreground">"Disconnect"</span></li>
                <li>Click <span className="font-medium text-foreground">"Connect"</span> again</li>
                <li>Make sure to <span className="font-medium text-foreground">authorize access to repositories</span> when prompted</li>
                <li>Return here and your repositories will load automatically</li>
              </ol>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Refresh hint */}
      {repositories.length === 0 && !isLoading && !error && (
        <div className="rounded-lg border border-muted bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            No repositories found. Try refreshing.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="mt-2"
          >
            Refresh
          </Button>
        </div>
      )}

      {/* Repository List */}
      <div className="grid gap-4">
        {filteredRepos.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {search ? "No repositories found matching your search." : "No repositories found."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRepos.map((repo) => (
            <Card key={repo.id} className="hover:border-accent-blue/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-accent-blue" />
                      {repo.full_name}
                      {repo.private && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          Private
                        </span>
                      )}
                    </CardTitle>
                    {repo.description && (
                      <CardDescription className="mt-1">
                        {repo.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleSelect(repo)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
