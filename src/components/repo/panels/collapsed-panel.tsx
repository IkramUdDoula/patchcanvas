'use client'

import { memo } from 'react'
import { GitBranch, GitPullRequest, GitCommit, FileCode, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

type PanelType = 'branches' | 'prs' | 'commits' | 'files'

interface CollapsedPanelProps {
  type: PanelType
  onExpand: () => void
}

const panelConfig = {
  branches: {
    icon: GitBranch,
    title: 'Show branches',
  },
  prs: {
    icon: GitPullRequest,
    title: 'Show pull requests',
  },
  commits: {
    icon: GitCommit,
    title: 'Show commits',
  },
  files: {
    icon: FileCode,
    title: 'Show files',
  },
}

export const CollapsedPanel = memo(function CollapsedPanel({ type, onExpand }: CollapsedPanelProps) {
  const config = panelConfig[type]
  const Icon = config.icon

  return (
    <button
      onClick={onExpand}
      className="w-10 bg-card rounded-lg shadow-sm border border-border flex flex-col items-center justify-center gap-2 py-4 hover:bg-accent group"
      title={config.title}
    >
      <Icon className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
      <ChevronLeft className="h-2.5 w-2.5 rotate-180 text-muted-foreground group-hover:text-foreground" />
    </button>
  )
})
