"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, GitMerge, ChevronDown, Check, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserMenu } from "@/components/layout/user-menu"
import { useRepoStore } from "@/stores/repo-store"
import { useRepositories } from "@/hooks/use-repo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useState, useMemo } from "react"

interface ContextBarProps {
  showBackButton?: boolean
}

export function ContextBar({ showBackButton = false }: ContextBarProps) {
  const router = useRouter()
  const { selectedRepo, selectRepo } = useRepoStore()
  const { data: repositories = [], isLoading } = useRepositories()
  const [searchQuery, setSearchQuery] = useState("")

  const handleBack = () => {
    router.push('/dashboard')
  }

  const handleRepoSwitch = (repoFullName: string) => {
    const [owner, name] = repoFullName.split('/')
    const repo = repositories.find(r => r.owner === owner && r.name === name)
    if (repo) {
      selectRepo(repo)
      router.push(`/repo/${owner}/${name}`)
    }
    setSearchQuery("")
  }

  const filteredRepositories = useMemo(() => {
    if (!searchQuery.trim()) return repositories
    
    const query = searchQuery.toLowerCase()
    return repositories.filter(repo => 
      repo.full_name.toLowerCase().includes(query) ||
      repo.name.toLowerCase().includes(query) ||
      repo.owner.toLowerCase().includes(query)
    )
  }, [repositories, searchQuery])

  return (
    <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Separator orientation="vertical" className="h-6" />
              </>
            )}

            {selectedRepo && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="gap-2 font-semibold hover:bg-muted/50"
                  >
                    <GitMerge className="h-4 w-4 text-accent-blue" />
                    <span>{selectedRepo.full_name}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Switch Repository
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Search Bar */}
                  <div className="px-2 pb-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search repositories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>

                  <DropdownMenuSeparator />
                  
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                      <DropdownMenuItem disabled>
                        <span className="text-sm text-muted-foreground">Loading...</span>
                      </DropdownMenuItem>
                    ) : filteredRepositories.length === 0 ? (
                      <DropdownMenuItem disabled>
                        <span className="text-sm text-muted-foreground">
                          {searchQuery ? 'No repositories found' : 'No repositories'}
                        </span>
                      </DropdownMenuItem>
                    ) : (
                      filteredRepositories.map((repo) => (
                        <DropdownMenuItem
                          key={repo.id}
                          onClick={() => handleRepoSwitch(repo.full_name)}
                          className={cn(
                            "cursor-pointer",
                            selectedRepo.id === repo.id && "bg-accent"
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <GitMerge className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm truncate">{repo.full_name}</span>
                            </div>
                            {selectedRepo.id === repo.id && (
                              <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleBack}
                    className="cursor-pointer text-primary"
                  >
                    <span className="text-sm">View all repositories</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>
    </div>
  )
}
