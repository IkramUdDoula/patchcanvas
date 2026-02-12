'use client'

import { useState } from 'react'
import { GitMerge, ChevronDown, Loader2, AlertCircle, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { PRDetails, CheckRun, PRReview } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cacheDelete } from '@/lib/indexdb'
import { useQueryClient } from '@tanstack/react-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface PRMergeButtonProps {
  pr: PRDetails
  checks: CheckRun[]
  reviews: PRReview[]
  onMergeSuccess?: () => void
  onCloseSuccess?: () => void
}

export function PRMergeButton({ pr, checks, reviews, onMergeSuccess, onCloseSuccess }: PRMergeButtonProps) {
  const queryClient = useQueryClient()
  const [merging, setMerging] = useState(false)
  const [closing, setClosing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<'merge' | 'squash' | 'rebase'>('merge')
  const [error, setError] = useState<string | null>(null)

  const checksStatus = checks.length === 0 ? 'none' : 
    checks.every(c => c.conclusion === 'success') ? 'success' :
    checks.some(c => c.conclusion === 'failure') ? 'failure' : 'pending'

  const approvedReviews = reviews.filter(r => r.state === 'APPROVED').length
  const changesRequested = reviews.filter(r => r.state === 'CHANGES_REQUESTED').length

  const canMerge = pr.state === 'open' && 
    !pr.hasConflicts && 
    checksStatus !== 'failure' &&
    changesRequested === 0

  const handleMerge = async () => {
    setMerging(true)
    setError(null)
    try {
      const pathParts = window.location.pathname.split('/')
      const owner = pathParts[2]
      const repo = pathParts[3]

      const response = await fetch(
        `/api/pulls/${pr.number}/merge?owner=${owner}&repo=${repo}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merge_method: selectedMethod,
            commit_title: `${pr.title} (#${pr.number})`,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to merge')
      }

      // Invalidate PR list cache to update PR state immediately
      const cacheKey = `${owner}/${repo}/${pr.targetBranch}`
      await cacheDelete('pulls', cacheKey)
      
      // Invalidate React Query caches
      queryClient.invalidateQueries({ queryKey: ['pulls-graphql', owner, repo, pr.targetBranch] })
      queryClient.invalidateQueries({ queryKey: ['pr-details', owner, repo, pr.number] })

      onMergeSuccess?.()
      setShowConfirm(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to merge pull request')
    } finally {
      setMerging(false)
    }
  }

  const handleClose = async () => {
    setClosing(true)
    setError(null)
    try {
      const pathParts = window.location.pathname.split('/')
      const owner = pathParts[2]
      const repo = pathParts[3]

      const response = await fetch(
        `/api/pulls/${pr.number}/close?owner=${owner}&repo=${repo}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to close PR')
      }

      // Invalidate PR list cache to update PR state immediately
      const cacheKey = `${owner}/${repo}/${pr.targetBranch}`
      await cacheDelete('pulls', cacheKey)
      
      // Invalidate React Query caches
      queryClient.invalidateQueries({ queryKey: ['pulls-graphql', owner, repo, pr.targetBranch] })
      queryClient.invalidateQueries({ queryKey: ['pr-details', owner, repo, pr.number] })

      onCloseSuccess?.()
      setShowCloseConfirm(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to close pull request')
    } finally {
      setClosing(false)
    }
  }

  const getMergeMethodLabel = (method: string) => {
    switch (method) {
      case 'merge':
        return 'Create a merge commit'
      case 'squash':
        return 'Squash and merge'
      case 'rebase':
        return 'Rebase and merge'
      default:
        return method
    }
  }

  // Show merged/closed state
  if (pr.state === 'merged') {
    return (
      <Button variant="secondary" disabled className="gap-2">
        <GitMerge className="h-4 w-4" />
        Merged
      </Button>
    )
  }

  if (pr.state === 'closed') {
    return (
      <Button variant="secondary" disabled className="gap-2">
        <XCircle className="h-4 w-4" />
        Closed
      </Button>
    )
  }

  // Show resolve conflicts button if PR has conflicts
  if (pr.hasConflicts) {
    const pathParts = window.location.pathname.split('/')
    const owner = pathParts[2]
    const repo = pathParts[3]
    const conflictsUrl = `https://github.com/${owner}/${repo}/pull/${pr.number}/conflicts`
    
    return (
      <div className="flex gap-2">
        <Button 
          variant="destructive"
          onClick={() => window.open(conflictsUrl, '_blank')}
          className="gap-2"
        > Resolve conflicts
        </Button>
        
        {/* Close PR button - always available for open PRs */}
        <Button 
          variant="outline" 
          onClick={() => setShowCloseConfirm(true)}
          disabled={merging || closing}
          className="gap-2"
        >
          {closing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Closing...
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              Close PR
            </>
          )}
        </Button>
        
        <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Close pull request</DialogTitle>
              <DialogDescription>
                Are you sure you want to close this pull request without merging?
                You can reopen it later if needed.
              </DialogDescription>
            </DialogHeader>
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900">
                {error}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCloseConfirm(false)} disabled={closing}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleClose} disabled={closing}>
                {closing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Closing...
                  </>
                ) : (
                  'Close pull request'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Show merge button with status popover
  return (
    <>
      <div className="flex gap-2">
        {!canMerge && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Merging blocked
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Merge requirements</h4>
                <div className="space-y-2 text-sm">
                  {checksStatus === 'failure' && (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Some checks failed</span>
                    </div>
                  )}
                  {checksStatus === 'pending' && (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Checks in progress</span>
                    </div>
                  )}
                  {changesRequested > 0 && (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-4 w-4 flex-shrink-0" />
                      <span>Changes requested</span>
                    </div>
                  )}
                  {checksStatus === 'success' && changesRequested === 0 && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      <span>All requirements met</span>
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
        
        {canMerge && (
          <>
            <Button 
              onClick={() => setShowConfirm(true)}
              disabled={merging || closing}
              className="gap-2"
            >
              {merging ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Merging...
                </>
              ) : (
                <>
                  <GitMerge className="h-4 w-4" />
                  Merge pull request
                </>
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" disabled={merging || closing}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setSelectedMethod('merge'); setShowConfirm(true); }}>
                  Create a merge commit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedMethod('squash'); setShowConfirm(true); }}>
                  Squash and merge
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSelectedMethod('rebase'); setShowConfirm(true); }}>
                  Rebase and merge
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        
        {/* Close PR button - always available for open PRs */}
        <Button 
          variant="outline" 
          onClick={() => setShowCloseConfirm(true)}
          disabled={merging || closing}
          className="gap-2"
        >
          {closing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Closing...
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              Close PR
            </>
          )}
        </Button>
      </div>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge pull request</DialogTitle>
            <DialogDescription>
              Are you sure you want to merge this pull request using <strong>{getMergeMethodLabel(selectedMethod)}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={merging}>
              Cancel
            </Button>
            <Button onClick={handleMerge} disabled={merging}>
              {merging ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Merging...
                </>
              ) : (
                'Confirm merge'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close pull request</DialogTitle>
            <DialogDescription>
              Are you sure you want to close this pull request without merging?
              You can reopen it later if needed.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseConfirm(false)} disabled={closing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClose} disabled={closing}>
              {closing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Closing...
                </>
              ) : (
                'Close pull request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
