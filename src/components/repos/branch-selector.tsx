"use client"

import { useEffect, useState } from "react"
import { Check, ChevronsUpDown, GitBranch, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Branch } from "@/lib/types"

interface BranchSelectorProps {
  owner: string
  repo: string
  selectedBranch: string | null
  onBranchSelect: (branch: string) => void
}

export function BranchSelector({ owner, repo, selectedBranch, onBranchSelect }: BranchSelectorProps) {
  const [open, setOpen] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBranches()
  }, [owner, repo])

  const fetchBranches = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/branches?owner=${owner}&repo=${repo}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch branches')
      }

      const data = await response.json()
      setBranches(data)
      
      // If no branch is selected, select the default branch
      if (!selectedBranch) {
        const defaultBranch = data.find((b: Branch) => b.isDefault)
        if (defaultBranch) {
          onBranchSelect(defaultBranch.name)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch branches')
    } finally {
      setIsLoading(false)
    }
  }

  const currentBranch = branches?.find((b) => b.name === selectedBranch)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : currentBranch ? (
            <>
              <GitBranch className="mr-2 h-4 w-4" />
              <span className="truncate">{currentBranch.name}</span>
            </>
          ) : (
            "Select branch..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search branches..." />
          <CommandList>
            <CommandEmpty>No branch found.</CommandEmpty>
            <CommandGroup>
              {branches.map((branch) => (
                <CommandItem
                  key={branch.name}
                  value={branch.name}
                  onSelect={(currentValue: string) => {
                    onBranchSelect(currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedBranch === branch.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <GitBranch className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate">{branch.name}</span>
                  {branch.isDefault && (
                    <span className="ml-2 text-xs text-accent-blue">default</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
