'use client'

import { memo, lazy, Suspense } from 'react'
import { FileCode } from 'lucide-react'
import { useRepoExplorerStore } from '@/stores/repo-explorer-store'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load heavy components
const InteractiveDiffViewer = lazy(() => import('./diff-viewer').then(m => ({ default: m.InteractiveDiffViewer })))
const BranchDetails = lazy(() => import('./branch-details').then(m => ({ default: m.BranchDetails })))
const PRDetails = lazy(() => import('./pr-details').then(m => ({ default: m.PRDetails })))
const CommitDetails = lazy(() => import('./commit-details').then(m => ({ default: m.CommitDetails })))

interface ContentViewerProps {
  defaultBranch: string
}

function LoadingFallback() {
  return (
    <div className="p-8 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

export const ContentViewer = memo(function ContentViewer({ 
  defaultBranch
}: ContentViewerProps) {
  const { owner, repo, selection } = useRepoExplorerStore()

  if (!owner || !repo) {
    return <EmptyState />
  }

  // File selected - show diff viewer
  if (selection?.filePath && selection?.commitSha) {
    // For commit file diffs, we need to compare against the parent commit
    // The API will handle this - we pass the commit SHA as head
    // and the parent will be determined by the API (commit~1)
    const base = `${selection.commitSha}~1`; // Parent commit
    const head = selection.commitSha;
    
    return (
      <Suspense fallback={<LoadingFallback />}>
        <InteractiveDiffViewer
          owner={owner}
          repo={repo}
          filePath={selection.filePath}
          base={base}
          head={head}
        />
      </Suspense>
    )
  }

  // Commit selected - show commit details
  if (selection?.commitSha) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <CommitDetails
          owner={owner}
          repo={repo}
          commitSha={selection.commitSha}
          defaultBranch={defaultBranch}
        />
      </Suspense>
    )
  }

  // PR selected - show PR details
  if (selection?.prNumber) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <PRDetails
          owner={owner}
          repo={repo}
          prNumber={selection.prNumber}
        />
      </Suspense>
    )
  }

  // Branch selected - show branch details
  if (selection?.branchName) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <BranchDetails
          owner={owner}
          repo={repo}
          branchName={selection.branchName}
        />
      </Suspense>
    )
  }

  return <EmptyState />
})

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <div className="text-center">
        <FileCode className="h-16 w-16 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-semibold mb-2">Select an item to view details</p>
        <p className="text-sm">Navigate through branches → PRs → commits → files</p>
      </div>
    </div>
  )
}
