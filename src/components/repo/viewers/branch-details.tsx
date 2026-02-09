'use client'

import { useEffect, useState } from 'react'
import { GitBranch, Calendar, GitCommit, AlertCircle } from 'lucide-react'
import { Branch } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface BranchDetailsProps {
  owner: string
  repo: string
  branchName: string
}

export function BranchDetails({ owner, repo, branchName }: BranchDetailsProps) {
  const [branch, setBranch] = useState<Branch | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBranchDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch(`/api/repos?action=branches&owner=${owner}&repo=${repo}`)
        if (!response.ok) throw new Error('Failed to fetch branches')
        const branches = await response.json()
        const foundBranch = branches.find((b: Branch) => b.name === branchName)
        setBranch(foundBranch || null)
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
        <div className="p-4 space-y-3">
          <div className="rounded-lg border border-border/50 overflow-hidden bg-card hover:border-border transition-all">
            <div className="bg-muted px-3 py-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <GitCommit className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Latest commit</span>
              </div>
            </div>
            <div className="p-3">
              <code className="text-sm bg-muted px-3 py-1.5 rounded font-mono inline-block">
                {branch.commit.sha.substring(0, 7)}
              </code>
            </div>
          </div>

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
        </div>
      </div>
    </div>
  )
}
