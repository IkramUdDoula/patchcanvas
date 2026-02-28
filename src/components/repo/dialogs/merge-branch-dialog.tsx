'use client'

import { useState, useEffect } from 'react'
import { GitMerge, AlertCircle, ArrowRight, GitCommit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Branch } from '@/lib/types'

interface MergeBranchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceBranch: string
  owner: string
  repo: string
  branches: Branch[]
  onSuccess: () => void
}

interface ComparisonData {
  ahead_by: number
  behind_by: number
  status: string
  total_commits: number
  commits: Array<{
    sha: string
    message: string
    author: string
    date: string
  }>
}

export function MergeBranchDialog({
  open,
  onOpenChange,
  sourceBranch,
  owner,
  repo,
  branches,
  onSuccess,
}: MergeBranchDialogProps) {
  const [targetBranch, setTargetBranch] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [isLoadingComparison, setIsLoadingComparison] = useState(false)

  const defaultBranch = branches.find(b => b.isDefault)?.name || 'main'

  // Set default target branch when dialog opens
  useEffect(() => {
    if (open && !targetBranch) {
      setTargetBranch(defaultBranch)
      setTitle(`Merge ${sourceBranch} into ${defaultBranch}`)
    }
  }, [open, targetBranch, defaultBranch, sourceBranch])

  // Fetch comparison when target branch changes
  useEffect(() => {
    if (!targetBranch || !open) return

    const fetchComparison = async () => {
      setIsLoadingComparison(true)
      setError(null)
      try {
        const response = await fetch(
          `/api/branches/compare?owner=${owner}&repo=${repo}&base=${targetBranch}&head=${sourceBranch}`
        )
        if (!response.ok) {
          throw new Error('Failed to compare branches')
        }
        const data = await response.json()
        setComparison(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to compare branches')
        setComparison(null)
      } finally {
        setIsLoadingComparison(false)
      }
    }

    fetchComparison()
  }, [targetBranch, sourceBranch, owner, repo, open])

  const handleCreate = async () => {
    if (!targetBranch || !title) return

    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch('/api/pulls/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo,
          title,
          body,
          head: sourceBranch,
          base: targetBranch,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create pull request')
      }

      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setTitle('')
      setBody('')
      setTargetBranch('')
      setComparison(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pull request')
    } finally {
      setIsCreating(false)
    }
  }

  const canMerge = comparison && comparison.ahead_by > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5" />
            Create Pull Request
          </DialogTitle>
          <DialogDescription>
            Create a pull request to merge <code className="font-mono text-sm bg-muted px-1 py-0.5 rounded">{sourceBranch}</code> into another branch
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Target Branch Selection */}
          <div className="space-y-2">
            <Label htmlFor="target-branch">Target Branch</Label>
            <Select value={targetBranch} onValueChange={setTargetBranch}>
              <SelectTrigger id="target-branch">
                <SelectValue placeholder="Select target branch" />
              </SelectTrigger>
              <SelectContent>
                {branches
                  .filter(b => b.name !== sourceBranch)
                  .map(branch => (
                    <SelectItem key={branch.name} value={branch.name}>
                      <div className="flex items-center gap-2">
                        {branch.name}
                        {branch.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            default
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Branch Comparison */}
          {targetBranch && (
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <code className="font-mono text-purple-600 dark:text-purple-400 bg-muted px-2 py-1 rounded">
                  {sourceBranch}
                </code>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <code className="font-mono text-purple-600 dark:text-purple-400 bg-muted px-2 py-1 rounded">
                  {targetBranch}
                </code>
              </div>

              {isLoadingComparison ? (
                <div className="text-sm text-muted-foreground">Loading comparison...</div>
              ) : comparison ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <GitCommit className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="font-semibold">{comparison.ahead_by}</span>
                      <span className="text-muted-foreground">commits ahead</span>
                    </div>
                    {comparison.behind_by > 0 && (
                      <div className="flex items-center gap-1">
                        <GitCommit className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="font-semibold">{comparison.behind_by}</span>
                        <span className="text-muted-foreground">commits behind</span>
                      </div>
                    )}
                  </div>

                  {comparison.ahead_by === 0 && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                      <AlertCircle className="h-4 w-4" />
                      <span>No commits to merge. Branches are up to date.</span>
                    </div>
                  )}

                  {comparison.behind_by > 0 && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-2 rounded">
                      <AlertCircle className="h-4 w-4" />
                      <span>Source branch is behind target. Consider updating before merging.</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* PR Title */}
          <div className="space-y-2">
            <Label htmlFor="pr-title">Pull Request Title</Label>
            <Input
              id="pr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter PR title"
            />
          </div>

          {/* PR Description */}
          <div className="space-y-2">
            <Label htmlFor="pr-body">Description (optional)</Label>
            <Textarea
              id="pr-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Add a description for this pull request"
              rows={4}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-md border border-destructive/20">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !canMerge || !title || isLoadingComparison}
          >
            {isCreating ? 'Creating...' : 'Create Pull Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
