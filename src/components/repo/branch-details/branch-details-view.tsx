'use client'

import { useEffect, useCallback, useState, useMemo } from 'react'
import { ArrowLeft, FileText, GitBranch, CheckCircle2, Clock, Activity } from 'lucide-react'
import { usePRDetails, usePRTimeline, usePRReviews, usePRChecks, usePRFiles } from '../hooks/use-repo-data'
import { PROverviewCard } from './pr-overview-card'
import { PRMergeButton } from './pr-merge-button'
import { PRChecksPanel } from './pr-checks-panel'
import { PRReviewsPanel } from './pr-reviews-panel'
import { PRStatsCard } from './pr-stats-card'
import { PRTimeline } from './pr-timeline'
import { PRFilesSummary } from './pr-files-summary'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useReviewStateStore } from '@/stores/review-state-store'
import { calculatePRReviewProgress } from '@/lib/review-progress'
import { calculatePREffort } from '@/lib/effort-metrics'

interface BranchDetailsViewProps {
  owner: string
  repo: string
  prNumber: number
  onBack: () => void
}

export function BranchDetailsView({ owner, repo, prNumber, onBack }: BranchDetailsViewProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const { prDetails, loading: detailsLoading, refetch: refetchDetails } = usePRDetails(owner, repo, prNumber)
  const { timeline, loading: timelineLoading, refetch: refetchTimeline } = usePRTimeline(owner, repo, prNumber)
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = usePRReviews(owner, repo, prNumber)
  const { checks, loading: checksLoading, refetch: refetchChecks } = usePRChecks(owner, repo, prNumber)
  const { files, loading: filesLoading, refetch: refetchFiles } = usePRFiles(owner, repo, prNumber)

  // Get review state from store
  const reviewStore = useReviewStateStore()
  const getPRReviewStates = reviewStore.getPRReviewStates
  
  // Calculate review progress and effort metrics
  const reviewProgress = useMemo(() => {
    if (!files.length) return null
    const fileReviewStates = getPRReviewStates(prNumber)
    
    // Convert to record format for calculatePRReviewProgress
    const fileReviewsRecord: Record<string, any> = {};
    fileReviewStates.forEach((review: any) => {
      const key = `${review.prNumber}:${review.filename}`;
      fileReviewsRecord[key] = review;
    });
    
    return calculatePRReviewProgress(fileReviewsRecord, prNumber, files.length)
  }, [files, prNumber, getPRReviewStates])
  
  const effortMetrics = useMemo(() => {
    if (!files.length) return null
    const additions = files.reduce((sum: number, f: any) => sum + (f.additions || 0), 0)
    const deletions = files.reduce((sum: number, f: any) => sum + (f.deletions || 0), 0)
    return calculatePREffort(files.length, additions, deletions, files)
  }, [files])

  const handleMergeSuccess = useCallback(() => {
    // Refetch all data after merge
    refetchDetails()
    refetchTimeline()
    refetchReviews()
    refetchChecks()
    refetchFiles()
  }, [refetchDetails, refetchTimeline, refetchReviews, refetchChecks, refetchFiles])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to go back
      if (e.key === 'Escape') {
        onBack()
      }
      // R to refresh
      if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        handleMergeSuccess()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack, handleMergeSuccess])

  if (detailsLoading) {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} aria-label="Go back to pull request list">
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Back to list
        </Button>
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!prDetails) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load PR details</p>
          <Button variant="ghost" size="sm" onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Back to list
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar" role="main" aria-labelledby="pr-title">
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="mb-2"
          aria-label="Go back to pull request list (ESC)"
        >
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Back to list
        </Button>

        <PROverviewCard 
          pr={prDetails} 
          reviewProgress={reviewProgress}
          effortMetrics={effortMetrics}
          actionButton={
            <PRMergeButton
              pr={prDetails}
              checks={checks}
              reviews={reviews}
              onMergeSuccess={handleMergeSuccess}
              onCloseSuccess={handleMergeSuccess}
            />
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
            <TabsTrigger 
              value="overview" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="files"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <FileText className="h-4 w-4 mr-2" />
              Files
              <Badge variant="secondary" className="ml-2 text-xs">
                {prDetails.changed_files}
              </Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="checks"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Checks
              {checks.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {checks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="timeline"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Clock className="h-4 w-4 mr-2" />
              Timeline
              {timeline.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {timeline.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="activity"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <PRReviewsPanel 
                  reviews={reviews} 
                  requestedReviewers={prDetails.requested_reviewers}
                  loading={reviewsLoading}
                />
              </div>
              <div className="space-y-6">
                <PRStatsCard pr={prDetails} />
                {prDetails.assignees.length > 0 && (
                  <div 
                    className="bg-card rounded-lg border border-border card-elevated p-5 space-y-4"
                    role="region"
                    aria-label="Assignees"
                  >
                    <h3 className="font-semibold text-base">Assignees</h3>
                    <ul className="space-y-3" role="list">
                      {prDetails.assignees.map((assignee) => (
                        <li key={assignee.id} className="flex items-center gap-3 text-sm">
                          <img 
                            src={assignee.avatar_url} 
                            alt={`${assignee.login}'s avatar`}
                            className="h-7 w-7 rounded-full border border-border"
                          />
                          <span className="font-medium">{assignee.login}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            <div className="max-w-4xl">
              <PRFilesSummary files={files} prNumber={prNumber} loading={filesLoading} />
            </div>
          </TabsContent>

          <TabsContent value="checks" className="mt-6">
            <div className="max-w-4xl">
              <PRChecksPanel checks={checks} loading={checksLoading} />
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <div className="max-w-4xl">
              <PRTimeline events={timeline} loading={timelineLoading} />
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <PRReviewsPanel 
                  reviews={reviews} 
                  requestedReviewers={prDetails.requested_reviewers}
                  loading={reviewsLoading}
                />
              </div>
              <div>
                <PRStatsCard pr={prDetails} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
