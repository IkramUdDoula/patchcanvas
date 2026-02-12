'use client'

import { useEffect, useState, useMemo } from 'react'
import { GitBranch, Calendar, GitCommit, AlertCircle, GitPullRequest, User, Clock, ArrowRight, XCircle, GitMerge, Trash2 } from 'lucide-react'
import { Branch, PullRequest, Commit } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRepoExplorerStore } from '@/stores/repo-explorer-store'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

interface BranchDetailsProps {
  owner: string
  repo: string
  branchName: string
}

export function BranchDetails({ owner, repo, branchName }: BranchDetailsProps) {
  const [branch, setBranch] = useState<Branch | null>(null)
  const [prs, setPRs] = useState<PullRequest[]>([])
  const [prDetails, setPRDetails] = useState<Record<number, any>>({})
  const [commits, setCommits] = useState<Commit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { selectPR, selectCommit, selectBranch } = useRepoExplorerStore()
  const queryClient = useQueryClient()

  // Filter open PRs for this branch (PRs targeting this branch)
  const openPRs = useMemo(() => {
    const filtered = prs.filter(pr => pr.targetBranch === branchName && pr.state === 'open')
    console.log('Branch:', branchName, 'Total PRs:', prs.length, 'Open PRs targeting this branch:', filtered.length, filtered)
    return filtered
  }, [prs, branchName])

  const handleDeleteBranch = async () => {
    try {
      setIsDeleting(true)
      setDeleteError(null)

      const response = await fetch(`/api/branches/delete?owner=${owner}&repo=${repo}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ branch: branchName }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete branch')
      }

      // Invalidate branches cache to trigger instant refresh in branch panel
      await queryClient.invalidateQueries({ queryKey: ['branches-graphql', owner, repo] })
      
      // Close dialog
      setShowDeleteDialog(false)
      
      // Fetch default branch and select it
      const branchResponse = await fetch(`/api/repos?action=branches&owner=${owner}&repo=${repo}`)
      if (branchResponse.ok) {
        const branches = await branchResponse.json()
        const defaultBranch = branches.find((b: Branch) => b.isDefault)
        if (defaultBranch) {
          selectBranch(defaultBranch.name)
        }
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete branch')
    } finally {
      setIsDeleting(false)
    }
  }

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
        const prResponse = await fetch(`/api/repos?action=pulls&owner=${owner}&repo=${repo}&state=open`)
        if (prResponse.ok) {
          const prData = await prResponse.json()
          setPRs(prData)
          
          // Fetch details for open PRs from this branch
          const openPRsForBranch = prData.filter((pr: PullRequest) => 
            pr.sourceBranch === branchName && pr.state === 'open'
          )
          
          const detailsPromises = openPRsForBranch.map(async (pr: PullRequest) => {
            try {
              const detailResponse = await fetch(`/api/repos?action=pr&owner=${owner}&repo=${repo}&number=${pr.number}`)
              if (detailResponse.ok) {
                return { number: pr.number, details: await detailResponse.json() }
              }
            } catch (e) {
              console.error(`Failed to fetch details for PR #${pr.number}`, e)
            }
            return null
          })
          
          const detailsResults = await Promise.all(detailsPromises)
          const detailsMap: Record<number, any> = {}
          detailsResults.forEach(result => {
            if (result) {
              detailsMap[result.number] = result.details
            }
          })
          setPRDetails(detailsMap)
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
            {!branch.isDefault && !branch.protected && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete branch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the branch <code className="font-mono text-sm bg-muted px-1 py-0.5 rounded">{branchName}</code>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-md border border-destructive/20">
              {deleteError}
            </div>
          )}

          {openPRs.length > 0 && (
            <div className="text-sm text-amber-600 dark:text-amber-400 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-900">
              Warning: This branch has {openPRs.length} open pull request{openPRs.length > 1 ? 's' : ''}. Deleting it may affect those PRs.
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBranch}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  const details = prDetails[pr.number]
                  
                  return (
                    <div
                      key={pr.number}
                      className="p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => selectPR(pr.number)}
                    >
                      {/* PR Number and Title */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <config.icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <Badge variant="secondary" className="font-mono text-[10px] px-2 py-0.5">
                            #{pr.number}
                          </Badge>
                          {pr.draft && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Draft
                            </Badge>
                          )}
                          {details?.hasConflicts && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-500/30">
                              Conflicts
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(pr.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* PR Title */}
                      <p className="text-xs text-foreground/90 leading-relaxed mb-2">
                        {pr.title}
                      </p>

                      {/* Branch info */}
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <code className="font-mono text-purple-600 dark:text-purple-400">{pr.sourceBranch}</code>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <code className="font-mono text-purple-600 dark:text-purple-400">{pr.targetBranch}</code>
                      </div>

                      {/* Stats and metadata */}
                      <div className="flex items-center gap-3 text-xs">
                        {/* Stats */}
                        {(details?.additions !== undefined || details?.deletions !== undefined) && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="text-green-600 dark:text-green-400">+{details.additions || 0}</span>
                            <span className="text-red-600 dark:text-red-400">-{details.deletions || 0}</span>
                            {details.changed_files && (
                              <span className="text-muted-foreground">
                                ({details.changed_files} {details.changed_files === 1 ? 'file' : 'files'})
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
