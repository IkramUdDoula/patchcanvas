'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, GitMerge, ChevronDown, Loader2, RefreshCw } from 'lucide-react'
import { PRDetails, CheckRun, PRReview } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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

interface PRMergePanelProps {
  pr: PRDetails
  checks: CheckRun[]
  reviews: PRReview[]
  onMergeSuccess?: () => void
}

export function PRMergePanel({ pr, checks, reviews, onMergeSuccess }: PRMergePanelProps) {
  const [merging, setMerging] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
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
      // Extract owner and repo from current URL or PR data
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

      onMergeSuccess?.()
      setShowConfirm(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to merge pull request')
    } finally {
      setMerging(false)
    }
  }

  const handleUpdateBranch = async () => {
    setUpdating(true)
    setError(null)
    try {
      const pathParts = window.location.pathname.split('/')
      const owner = pathParts[2]
      const repo = pathParts[3]

      const response = await fetch(
        `/api/pulls/${pr.number}/update-branch?owner=${owner}&repo=${repo}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update branch')
      }

      onMergeSuccess?.()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update branch')
    } finally {
      setUpdating(false)
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

  return (
    <Card className="p-5 space-y-4 card-elevated">
      <h3 className="font-semibold text-base">Merge Status</h3>
      
      <div className="space-y-3">
        {/* Checks Status */}
        {checks.length > 0 && (
          <div className="flex items-center gap-3 text-sm p-3 rounded-md bg-muted/30">
            {checksStatus === 'success' && (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span className="font-medium">All checks passed</span>
              </>
            )}
            {checksStatus === 'failure' && (
              <>
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <span className="font-medium">Some checks failed</span>
              </>
            )}
            {checksStatus === 'pending' && (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <span className="font-medium">Checks in progress</span>
              </>
            )}
          </div>
        )}

        {/* Reviews Status */}
        {reviews.length > 0 && (
          <div className="flex items-center gap-3 text-sm p-3 rounded-md bg-muted/30">
            {approvedReviews > 0 ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <span className="font-medium">{approvedReviews} approving review{approvedReviews > 1 ? 's' : ''}</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <span className="font-medium">No approving reviews</span>
              </>
            )}
          </div>
        )}

        {changesRequested > 0 && (
          <div className="flex items-center gap-3 text-sm p-3 rounded-md bg-red-500/10">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span className="font-medium">Changes requested</span>
          </div>
        )}

        {/* Conflicts Status */}
        <div className="flex items-center gap-3 text-sm p-3 rounded-md bg-muted/30">
          {pr.hasConflicts ? (
            <>
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span className="font-medium">This branch has conflicts</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <span className="font-medium">No conflicts</span>
            </>
          )}
        </div>
      </div>

      {pr.state === 'open' && (
        <div className="space-y-3 pt-2">
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}
          
          {canMerge ? (
            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                onClick={() => setShowConfirm(true)}
                disabled={merging}
              >
                {merging ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Merging...
                  </>
                ) : (
                  <>
                    <GitMerge className="h-4 w-4 mr-2" />
                    Merge pull request
                  </>
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" disabled={merging}>
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
            </div>
          ) : (
            <Button 
              className="w-full" 
              disabled
              variant="secondary"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Merging is blocked
            </Button>
          )}
          
          {!pr.hasConflicts && pr.mergeable_state !== 'clean' && (
            <Button 
              className="w-full" 
              variant="outline"
              onClick={handleUpdateBranch}
              disabled={updating}
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update branch
                </>
              )}
            </Button>
          )}
        </div>
      )}

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge pull request</DialogTitle>
            <DialogDescription>
              Are you sure you want to merge this pull request using <strong>{getMergeMethodLabel(selectedMethod)}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
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

      {pr.state === 'merged' && (
        <div className="flex items-center gap-3 text-sm text-purple-600 dark:text-purple-400 p-3 rounded-md bg-purple-500/10">
          <GitMerge className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">Pull request merged</span>
        </div>
      )}

      {pr.state === 'closed' && (
        <div className="flex items-center gap-3 text-sm text-red-600 dark:text-red-400 p-3 rounded-md bg-red-500/10">
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">Pull request closed</span>
        </div>
      )}
    </Card>
  )
}
