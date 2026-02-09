'use client'

import { useEffect, useState, useMemo } from 'react'
import { GitCommit, User, Hash, AlertCircle, GitMerge, Clock, Lightbulb, Eye, GitPullRequest } from 'lucide-react'
import { Commit } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useRepoExplorerStore } from '@/stores/repo-explorer-store'
import { useCommitFiles } from '@/components/repo/hooks/use-repo-data'
import { CreatePRDialog } from '@/components/repo/dialogs/create-pr-dialog'
import { 
  calculateCommitIntelligence, 
  getCommitRoleLabel, 
  getCommitScopeLabel,
  getCommitRoleBadgeStyle,
  getCommitScopeBadgeStyle,
} from '@/lib/commit-intelligence'

interface CommitDetailsProps {
  owner: string
  repo: string
  commitSha: string
  defaultBranch: string
}

export function CommitDetails({ owner, repo, commitSha, defaultBranch }: CommitDetailsProps) {
  const [commit, setCommit] = useState<Commit | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreatePRDialog, setShowCreatePRDialog] = useState(false)

  const { files } = useCommitFiles(owner, repo, commitSha)
  const { selection, selectPR } = useRepoExplorerStore()

  // Calculate commit intelligence
  const commitIntelligence = useMemo(() => {
    if (!commit || !files.length) return null
    return calculateCommitIntelligence(commit.message, files)
  }, [commit, files])

  // Use helper functions from commit-intelligence module
  const getRoleBadgeStyle = getCommitRoleBadgeStyle
  const getScopeBadgeStyle = getCommitScopeBadgeStyle

  useEffect(() => {
    const fetchCommitDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`/api/repos?action=commit&owner=${owner}&repo=${repo}&sha=${commitSha}`)
        if (!response.ok) throw new Error('Failed to fetch commit details')
        const data = await response.json()
        setCommit(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load commit details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCommitDetails()
  }, [owner, repo, commitSha])

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-muted/30 p-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-20 w-full mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
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
          <h3 className="text-lg font-semibold mb-2">Failed to load commit</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!commit) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <GitCommit className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Commit not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Commit Info Bar */}
      <div className="px-4 py-3 border-b border-border/50 bg-card">
        <div className="flex items-start gap-3 mb-3">
          {commit.isMergeCommit ? (
            <GitMerge className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          ) : (
            <GitCommit className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          )}
          <span className="text-sm font-mono font-semibold flex-1 leading-relaxed">
            {commit.message.split('\n')[0].substring(0, 200)}
            {commit.message.split('\n')[0].length > 200 && '...'}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Show PR badge if commit is associated with a PR */}
            {commit.associatedPR && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => selectPR(commit.associatedPR!.number)}
                className="h-7 px-2 gap-1.5"
                title={`View PR #${commit.associatedPR.number}`}
              >
                <GitPullRequest className="h-3.5 w-3.5" />
                <span className="text-xs">#{commit.associatedPR.number}</span>
                <Badge 
                  variant="outline" 
                  className={`ml-1 text-[10px] px-1.5 py-0 ${
                    commit.associatedPR.state === 'open' 
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : commit.associatedPR.state === 'merged'
                      ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30'
                      : 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30'
                  }`}
                >
                  {commit.associatedPR.state}
                </Badge>
              </Button>
            )}
            
            {/* Create PR button - only show if not already in a PR and not on default branch */}
            {!commit.associatedPR && selection?.branchName && selection.branchName !== defaultBranch && (
              <Button
                size="sm"
                onClick={() => setShowCreatePRDialog(true)}
                className="h-7 px-2 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                title="Create Pull Request"
              >
                <GitPullRequest className="h-3.5 w-3.5" />
                <span className="text-xs">Create PR</span>
              </Button>
            )}
            {commit.isMergeCommit && (
              <Badge variant="outline" className="text-xs">
                Merge Commit
              </Badge>
            )}
          </div>
        </div>
        
        {/* Role and Scope badges */}
        {commitIntelligence && (
          <div className="flex items-center gap-2 mb-3">
            <Badge 
              variant="outline" 
              className={`text-xs border ${getRoleBadgeStyle(commitIntelligence.role)}`}
            >
              {getCommitRoleLabel(commitIntelligence.role)}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs border ${getScopeBadgeStyle()}`}
            >
              {getCommitScopeLabel(commitIntelligence.scope)}
            </Badge>
          </div>
        )}
        
        {/* SHA, Line Changes, Author and Date */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/50">
          {/* Commit SHA */}
          <Badge variant="secondary" className="font-mono text-xs">
            {commit.abbreviatedSha}
          </Badge>
          
          {/* Line Changes */}
          {commitIntelligence && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pl-4 border-l border-border/50">
              <span className="text-green-600 dark:text-green-400">+{commitIntelligence.linesAdded}</span>
              <span className="text-red-600 dark:text-red-400">-{commitIntelligence.linesRemoved}</span>
              <span className="text-muted-foreground">
                ({commitIntelligence.netChange >= 0 ? '+' : ''}{commitIntelligence.netChange} net)
              </span>
            </div>
          )}
          
          {/* Author */}
          <div className="flex items-center gap-2 pl-4 border-l border-border/50">
            {commit.author.avatar_url ? (
              <Avatar className="h-5 w-5">
                <AvatarImage src={commit.author.avatar_url} alt={commit.author.name} />
                <AvatarFallback className="text-xs">{commit.author.name[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            <span className="text-xs text-muted-foreground">{commit.author.name}</span>
          </div>
          
          {/* Date */}
          <div className="flex items-center gap-2 pl-4 border-l border-border/50">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {new Date(commit.author.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Details Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-3">
          {/* Why This Commit Exists */}
          {commitIntelligence && (
            <div className="rounded-lg border border-border/50 overflow-hidden bg-card hover:border-border transition-all">
              <div className="bg-muted px-3 py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold text-muted-foreground">Why This Commit Exists</span>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm leading-relaxed">
                  {commitIntelligence.whyExists}
                </p>
              </div>
            </div>
          )}

          {/* Focus Areas */}
          {commitIntelligence && commitIntelligence.focusAreas.length > 0 && (
            <div className="rounded-lg border border-border/50 overflow-hidden bg-card hover:border-border transition-all">
              <div className="bg-muted px-3 py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-semibold text-muted-foreground">Focus Areas</span>
                </div>
              </div>
              <div className="p-3">
                <ul className="space-y-1.5">
                  {commitIntelligence.focusAreas.map((area, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {commit.message.split('\n').length > 1 && (
            <div className="rounded-lg border border-border/50 overflow-hidden bg-card hover:border-border transition-all">
              <div className="bg-muted px-3 py-2 border-b border-border/50">
                <span className="text-xs font-semibold text-muted-foreground">Description</span>
              </div>
              <div className="p-3">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {commit.message.split('\n').slice(1).join('\n').trim()}
                </p>
              </div>
            </div>
          )}

          {commit.parents && commit.parents.length > 0 && (
            <div className="rounded-lg border border-border/50 overflow-hidden bg-card hover:border-border transition-all">
              <div className="bg-muted px-3 py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">
                    Parent commit{commit.parents.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <div className="flex flex-col gap-2">
                  {commit.parents.map((parent) => (
                    <code key={parent} className="text-sm bg-muted px-3 py-1.5 rounded font-mono inline-block">
                      {parent.substring(0, 7)}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create PR Dialog */}
      {commit && selection?.branchName && (
        <CreatePRDialog
          open={showCreatePRDialog}
          onOpenChange={setShowCreatePRDialog}
          owner={owner}
          repo={repo}
          sourceBranch={selection.branchName}
          defaultBranch={defaultBranch}
          commitMessage={commit.message}
          commitSha={commit.sha}
          onSuccess={(prNumber) => {
            // Select the newly created PR to show it immediately
            selectPR(prNumber)
          }}
        />
      )}
    </div>
  )
}
