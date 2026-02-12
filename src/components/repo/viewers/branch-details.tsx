'use client'

import { useEffect, useState, useMemo } from 'react'
import { GitBranch, Calendar, GitCommit, AlertCircle, GitPullRequest, User, Clock, ArrowRight, XCircle, GitMerge } from 'lucide-react'
import { Branch, PullRequest, Commit } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRepoExplorerStore } from '@/stores/repo-explorer-store'
import { cn } from '@/lib/utils'

interface BranchDetailsProps {
  owner: string
  repo: string
  branchName: string
}

export function BranchDetails({ owner, repo, branchName }: BranchDetailsProps) {
  const [branch, setBranch] = useState<Branch | null>(null)
  const [prs, setPRs] = useState<PullRequest[]>([])
  const [commits, setCommits] = useState<Commit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { selectPR, selectCommit } = useRepoExplorerStore()

  // Filter open PRs for this branch
  const openPRs = useMemo(() => {
    return prs.filter(pr => pr.sourceBranch === branchName && pr.state === 'open')
  }, [prs, branchName])

  useEffect(() => {
    const fetchBranchDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch branch data
        const branchResponse = await fetch(`/api/repos?action=branches&owner=${owner}&repo=${repo}`)
        if (!branchResponse.ok) throw new Error('Failed to fetch branches')
        const branches = await branchResponse.json()
        const foundBranch = branches.find((b: Branch) => b.name === branchName)
        setBranch(foundBranch || null)

        // Fetch PRs for this branch
        const prResponse = await fetch(`/api/repos?action=prs&owner=${owner}&repo=${repo}`)
        if (prResponse.ok) {
          const prData = await prResponse.json()
          setPRs(prData)
        }

        // Fetch recent commits for this branch
        const commitResponse = await fetch(`/api/repos?action=commits&owner=${owner}&repo=${repo}&branch=${branchName}&per_page=5`)
        if (commitResponse.ok) {
          const commitData = await commitResponse.json()
          setCommits(commitData.commits || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load branch details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBranchDetails()
  }, [owner, repo, branchName])

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-muted/30 p-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-20 w-full mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load branch</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!branch) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Branch not found</p>
        </div>
      </div>
    )
  }

  const prStateConfig = {
    open: { 
      icon: GitPullRequest, 
      label: 'Open', 
      className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' 
    },
    closed: { 
      icon: XCircle, 
      label: 'Closed', 
      className: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' 
    },
    merged: { 
      icon: GitMerge, 
      label: 'Merged', 
      className: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30' 
    },
  }

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Branch Info Bar */}
      <div className="px-4 py-3 border-b border-border/50 bg-card">
        <div className="flex items-center gap-3">
          <GitBranch className="h-4 w-4 text-primary" />
          <span className="text-sm font-mono font-semibold">{branch.name}</span>
          <div className="flex items-center gap-2 ml-auto">
            {branch.isDefault && (
              <Badge variant="secondary" className="text-xs">
                Default Branch
              </Badge>
            )}
            {branch.protected && (
              <Badge variant="outline" className="text-xs">
                Protected
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Details Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-4">
          
          {/* Open Pull Requests Section */}
          {openPRs.length > 0 && (
            <section className="rounded-lg border border-border/50 overflow-hidden bg-card">
              <div className="bg-muted px-3 py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-muted-foreground">
                    Open Pull Requests ({openPRs.length})
                  </span>
                </div>
              </div>
              <div className="divide-y divide-border/50">
                {openPRs.map((pr) => {
                  const config = prStateConfig[pr.state as keyof typeof prStateConfig] || prStateConfig.open
                  return (
                    <div
                      key={pr.number}
                      className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => selectPR(pr.number)}
                    >
                      {/* PR Title and Number */}
                      <div className="flex items-start gap-2 mb-2">
                        <config.icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm font-medium flex-1 leading-relaxed">
                          {pr.title}
                        </span>
                        <Badge variant="secondary" className="font-mono text-xs">
                          #{pr.number}
                        </Badge>
                      </div>

                      {/* Branch info */}
                      <div className="flex items-center gap-2 text-xs mb-2 ml-5">
                        <code className="font-mono text-purple-600 dark:text-purple-400">{pr.sourceBranch}</code>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <code className="font-mono text-purple-600 dark:text-purple-400">{pr.targetBranch}</code>
                      </div>

                      {/* Stats and metadata */}
                      <div className="flex items-center gap-3 ml-5 text-xs">
                        {/* Stats */}
                        {(pr.additions !== undefined || pr.deletions !== undefined) && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="text-green-600 dark:text-green-400">+{pr.additions || 0}</span>
                            <span className="text-red-600 dark:text-red-400">-{pr.deletions || 0}</span>
                            {pr.changed_files && (
                              <span className="text-muted-foreground">
                                ({pr.changed_files} {pr.changed_files === 1 ? 'file' : 'files'})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Author */}
                        <div className="flex items-center gap-1.5 pl-3 border-l border-border/50">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={pr.author.avatar_url} alt={pr.author.login} />
                            <AvatarFallback className="text-[10px]">{pr.author.login[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground">{pr.author.login}</span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-1.5 pl-3 border-l border-border/50">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {new Date(pr.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Draft badge */}
                        {pr.draft && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Draft
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Recent Commits Section */}
          {commits.length > 0 && (
            <section className="rounded-lg border border-border/50 overflow-hidden bg-card">
              <div className="bg-muted px-3 py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <GitCommit className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">
                    Recent Commits
                  </span>
                </div>
              </div>
              <div className="divide-y divide-border/50">
                {commits.map((commit) => {
                  // Truncate message to first 20 words
                  const words = commit.message.split(' ')
                  const truncatedMessage = words.length > 20 
                    ? words.slice(0, 20).join(' ') + '...'
                    : commit.message.split('\n')[0]
                  
                  return (
                    <div
                      key={commit.sha}
                      className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => selectCommit(commit.sha)}
                    >
                      {/* Hash and datetime */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {commit.isMergeCommit ? (
                            <GitMerge className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                          ) : (
                            <GitCommit className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          )}
                          <Badge 
                            variant="secondary" 
                            className="font-mono text-[10px] px-2 py-0.5"
                          >
                            {commit.abbreviatedSha}
                          </Badge>
                          {commit.isMergeCommit && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Merge
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(commit.author.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Commit message */}
                      <p className="text-xs text-foreground/90 leading-relaxed mb-2">
                        {truncatedMessage}
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-2 text-xs">
                        {commit.author.avatar_url ? (
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={commit.author.avatar_url} alt={commit.author.name} />
                            <AvatarFallback className="text-[10px]">{commit.author.name[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-2.5 w-2.5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="text-muted-foreground">{commit.author.name}</span>
                        
                        {/* Associated PR badge */}
                        {commit.associatedPR && (
                          <div className="flex items-center gap-1 ml-auto">
                            <GitPullRequest className="h-3 w-3 text-muted-foreground" />
                            <Badge 
                              variant="outline" 
                              className={cn(
                                'text-[10px] px-1.5 py-0',
                                commit.associatedPR.state === 'open' 
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                  : commit.associatedPR.state === 'merged'
                                  ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30'
                                  : 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30'
                              )}
                            >
                              #{commit.associatedPR.number}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Branch Metadata */}
          <section className="space-y-3">
            <div className="rounded-lg border border-border/50 overflow-hidden bg-card hover:border-border transition-all">
              <div className="bg-muted px-3 py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Last updated</span>
                </div>
              </div>
              <div className="p-3">
                <div className="text-sm">
                  {new Date(branch.commit.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
