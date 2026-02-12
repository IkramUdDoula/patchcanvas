'use client'

import { useState, useEffect } from 'react'
import { GitPullRequest, Loader2, GitBranch, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Branch } from '@/lib/types'
import { cacheDelete } from '@/lib/indexdb'
import { useQueryClient } from '@tanstack/react-query'

interface CreatePRDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  owner: string
  repo: string
  sourceBranch: string
  defaultBranch: string
  commitMessage: string
  commitSha: string
  onSuccess?: (prNumber: number) => void
}

export function CreatePRDialog({
  open,
  onOpenChange,
  owner,
  repo,
  sourceBranch,
  defaultBranch,
  commitMessage,
  commitSha,
  onSuccess,
}: CreatePRDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoadingBranches, setIsLoadingBranches] = useState(false)
  const [createNewBranch, setCreateNewBranch] = useState(true)
  const [newBranchName, setNewBranchName] = useState('')
  
  // Parse commit message - first line is title
  const commitLines = commitMessage.split('\n')
  const defaultTitle = commitLines[0] || ''
  
  const [title, setTitle] = useState(defaultTitle)
  const [baseBranch, setBaseBranch] = useState(defaultBranch)

  // Generate default branch name from commit SHA and reset when dialog opens
  useEffect(() => {
    if (open) {
      // Add timestamp to ensure uniqueness
      const timestamp = Date.now().toString(36).slice(-4)
      setNewBranchName(`pr/${commitSha.substring(0, 7)}-${timestamp}`)
      setBaseBranch(defaultBranch)
      fetchBranches()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const fetchBranches = async () => {
    try {
      setIsLoadingBranches(true)
      const response = await fetch(`/api/repos?action=branches&owner=${owner}&repo=${repo}`)
      if (!response.ok) throw new Error('Failed to fetch branches')
      const data = await response.json()
      setBranches(data)
    } catch (error) {
      console.error('Error fetching branches:', error)
      toast({
        title: 'Failed to load branches',
        description: 'Using default branch only',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingBranches(false)
    }
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for the pull request',
        variant: 'destructive',
      })
      return
    }

    if (createNewBranch && !newBranchName.trim()) {
      toast({
        title: 'Branch name required',
        description: 'Please enter a name for the new branch',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsCreating(true)
      
      let headBranch = sourceBranch
      
      // Create new branch if requested
      if (createNewBranch) {
        const createBranchResponse = await fetch('/api/branches/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            owner,
            repo,
            branchName: newBranchName.trim(),
            sha: commitSha,
          }),
        })

        if (!createBranchResponse.ok) {
          const error = await createBranchResponse.json()
          throw new Error(error.details || error.error || 'Failed to create branch')
        }

        headBranch = newBranchName.trim()
      }
      
      const response = await fetch('/api/pulls/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner,
          repo,
          title: title.trim(),
          body: '',
          head: headBranch,
          base: baseBranch,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        const errorMessage = error.details || error.error || 'Failed to create PR'
        
        // Provide more helpful error messages
        if (errorMessage.includes('No commits between')) {
          throw new Error('This commit is already in the target branch. No changes to create a PR.')
        }
        
        if (errorMessage.includes('Not Found') || response.status === 404) {
          throw new Error('Branch not found. Please ensure the branch exists and try again.')
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      
      // Invalidate PR list cache to show new PR immediately
      const cacheKey = `${owner}/${repo}/${baseBranch}`
      await cacheDelete('pulls', cacheKey)
      
      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ['pulls-graphql', owner, repo, baseBranch] })
      
      toast({
        title: 'Pull request created',
        description: `PR #${data.number} has been created successfully`,
      })
      
      onOpenChange(false)
      onSuccess?.(data.number)
    } catch (error) {
      console.error('Error creating PR:', error)
      toast({
        title: 'Failed to create PR',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <GitPullRequest className="h-5 w-5" />
            Create Pull Request
          </DialogTitle>
          <DialogDescription className="text-muted-foreground dark:text-muted-foreground">
            Create a new pull request for this commit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Create new branch option */}
          <div className="flex items-start space-x-3 rounded-lg border border-border p-3">
            <Checkbox
              id="create-branch"
              checked={createNewBranch}
              onCheckedChange={(checked) => setCreateNewBranch(checked as boolean)}
              disabled={isCreating}
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="create-branch" className="text-sm font-medium cursor-pointer text-foreground">
                Create new branch for this commit only
              </Label>
              <p className="text-xs text-muted-foreground">
                Recommended: Creates a new branch from this specific commit
              </p>
              {createNewBranch && (
                <Input
                  placeholder="Branch name"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  disabled={isCreating}
                  className="mt-2"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground">Title</Label>
            <Input
              id="title"
              placeholder="Enter PR title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="base" className="text-foreground">Base branch (target)</Label>
            <Select
              value={baseBranch}
              onValueChange={setBaseBranch}
              disabled={isCreating || isLoadingBranches}
            >
              <SelectTrigger id="base" className="w-full">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue>
                    {baseBranch || "Select base branch"}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {isLoadingBranches ? (
                  <SelectItem value="loading" disabled>
                    Loading branches...
                  </SelectItem>
                ) : branches.length > 0 ? (
                  branches.map((branch) => (
                    <SelectItem key={branch.name} value={branch.name}>
                      <div className="flex items-center gap-2">
                        <span>{branch.name}</span>
                        {branch.isDefault && (
                          <span className="text-xs text-muted-foreground">(default)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value={defaultBranch}>{defaultBranch}</SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              PR will merge {createNewBranch ? (
                <>new branch <span className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">{newBranchName || '(unnamed)'}</span></>
              ) : (
                <>branch <span className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">{sourceBranch}</span></>
              )} into <span className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">{baseBranch}</span>
            </p>
          </div>
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
            disabled={isCreating || !title.trim() || (createNewBranch && !newBranchName.trim())}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <GitPullRequest className="h-4 w-4 mr-2" />
                Create Pull Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
