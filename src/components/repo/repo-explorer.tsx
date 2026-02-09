'use client'

import { useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useRepoExplorerStore } from '@/stores/repo-explorer-store'
import { BranchPanel, PRPanel, CommitPanel, FilePanel, CollapsedPanel } from './panels'

interface RepoExplorerProps {
  owner: string
  repo: string
  defaultBranch: string
}

export function RepoExplorer({ owner, repo, defaultBranch }: RepoExplorerProps) {
    const { 
      setRepoContext, 
      panels, 
      togglePanel,
      selection,
      selectBranch,
    } = useRepoExplorerStore()

    // Initialize repo context
    useEffect(() => {
      setRepoContext(owner, repo)
    }, [owner, repo, defaultBranch, setRepoContext])

    // Auto-select default branch on mount
    useEffect(() => {
      if (defaultBranch && selection && !selection.branchName) {
        selectBranch(defaultBranch)
      }
    }, [defaultBranch, selection?.branchName, selectBranch])

    return (
      <div className="flex h-full gap-2">
        {/* Branch Panel */}
        {panels.branch ? (
          <BranchPanel onCollapse={() => togglePanel('branches')} />
        ) : (
          <CollapsedPanel type="branches" onExpand={() => togglePanel('branches')} />
        )}

        {/* PR Panel */}
        {panels.pr ? (
          <PRPanel onCollapse={() => togglePanel('prs')} />
        ) : (
          <CollapsedPanel type="prs" onExpand={() => togglePanel('prs')} />
        )}

        {/* Commit Panel */}
        {panels.commit ? (
          <CommitPanel onCollapse={() => togglePanel('commits')} />
        ) : (
          <CollapsedPanel type="commits" onExpand={() => togglePanel('commits')} />
        )}

        {/* File Panel */}
        {panels.file ? (
          <FilePanel onCollapse={() => togglePanel('files')} />
        ) : (
          <CollapsedPanel type="files" onExpand={() => togglePanel('files')} />
        )}
      </div>
    )
  }
