import { create } from 'zustand';
import type { Repository, PullRequest } from '@/lib/types';

// Unified app store
interface AppStore {
  // Repository state
  repositories: Repository[];
  selectedRepo: Repository | null;
  selectedBranch: string | null;
  isLoading: boolean;
  error: string | null;

  // UI state
  expandedBranches: Set<string>;
  expandedPRs: Set<number>;
  expandedCommits: Set<string>;
  
  // Panel visibility state
  panels: {
    branch: boolean;
    pr: boolean;
    commit: boolean;
    file: boolean;
  };
  
  // Selection state
  selectedItem: {
    type: 'branch' | 'pr' | 'commit' | 'file';
    branchName?: string;
    prNumber?: number;
    commitSha?: string;
    filePath?: string;
    // Preserve branch context for PRs and commits
    baseBranch?: string;
  } | null;

  // Review state (persisted to localStorage)
  fileReviews: Record<string, {
    prNumber?: number;
    commitSha?: string;
    filename: string;
    state: 'not_reviewed' | 'in_review' | 'reviewed';
    reviewedAt?: Date;
  }>;

  // Filter state (persisted to localStorage)
  filters: {
    branch: {
      search: string;
    };
    pr: {
      search: string;
      state: 'all' | 'open' | 'closed';
    };
  };

  // Repository actions
  setRepositories: (repos: Repository[]) => void;
  selectRepo: (repo: Repository) => void;
  selectBranch: (branch: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // UI actions
  toggleBranch: (name: string) => void;
  togglePR: (number: number) => void;
  toggleCommit: (sha: string) => void;
  selectItem: (item: AppStore['selectedItem']) => void;
  clearSelection: () => void;
  togglePanel: (panel: 'branch' | 'pr' | 'commit' | 'file') => void;

  // Review actions
  setFileReviewState: (prNumber: number, filename: string, state: 'not_reviewed' | 'in_review' | 'reviewed') => void;
  getFileReviewState: (prNumber: number, filename: string) => 'not_reviewed' | 'in_review' | 'reviewed';
  clearPRReviews: (prNumber: number) => void;

  // Filter actions
  setBranchFilter: (search: string) => void;
  setPRFilter: (search: string, state?: 'all' | 'open' | 'closed') => void;
  clearFilters: () => void;
}

export const useStore = create<AppStore>((set, get) => ({
  // Initial state
  repositories: [],
  selectedRepo: null,
  selectedBranch: null,
  isLoading: false,
  error: null,
  expandedBranches: new Set(),
  expandedPRs: new Set(),
  expandedCommits: new Set(),
  selectedItem: null,
  fileReviews: {},
  panels: {
    branch: true,
    pr: true,
    commit: true,
    file: true,
  },
  filters: {
    branch: { search: '' },
    pr: { search: '', state: 'all' },
  },

  // Repository actions
  setRepositories: (repositories) => set({ repositories, isLoading: false }),
  
  selectRepo: (selectedRepo) => 
    set({ selectedRepo, selectedBranch: selectedRepo.default_branch }),
  
  selectBranch: (selectedBranch) => set({ selectedBranch }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),

  // UI actions
  toggleBranch: (name) =>
    set((state) => {
      const newSet = new Set(state.expandedBranches);
      newSet.has(name) ? newSet.delete(name) : newSet.add(name);
      return { expandedBranches: newSet };
    }),

  togglePR: (number) =>
    set((state) => {
      const newSet = new Set(state.expandedPRs);
      newSet.has(number) ? newSet.delete(number) : newSet.add(number);
      return { expandedPRs: newSet };
    }),

  toggleCommit: (sha) =>
    set((state) => {
      const newSet = new Set(state.expandedCommits);
      newSet.has(sha) ? newSet.delete(sha) : newSet.add(sha);
      return { expandedCommits: newSet };
    }),

  selectItem: (item) => set({ selectedItem: item }),
  
  clearSelection: () => set({ selectedItem: null }),

  togglePanel: (panel) =>
    set((state) => ({
      panels: {
        ...state.panels,
        [panel]: !state.panels[panel],
      },
    })),

  // Review actions
  setFileReviewState: (prNumber, filename, state) => {
    const key = `${prNumber}:${filename}`;
    set((store) => {
      const newFileReviews = {
        ...store.fileReviews,
        [key]: {
          prNumber,
          filename,
          state,
          reviewedAt: state === 'reviewed' ? new Date() : undefined,
        },
      };
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('review-states', JSON.stringify(newFileReviews));
        } catch (e) {
          console.error('Failed to save review state:', e);
        }
      }
      
      return { fileReviews: newFileReviews };
    });
  },

  getFileReviewState: (prNumber, filename) => {
    const key = `${prNumber}:${filename}`;
    return get().fileReviews[key]?.state || 'not_reviewed';
  },

  clearPRReviews: (prNumber) => {
    set((store) => {
      const newFileReviews = { ...store.fileReviews };
      Object.keys(newFileReviews).forEach((key) => {
        if (newFileReviews[key].prNumber === prNumber) {
          delete newFileReviews[key];
        }
      });
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('review-states', JSON.stringify(newFileReviews));
        } catch (e) {
          console.error('Failed to save review state:', e);
        }
      }
      
      return { fileReviews: newFileReviews };
    });
  },

  // Filter actions
  setBranchFilter: (search) => {
    set((store) => {
      const newFilters = {
        ...store.filters,
        branch: { search },
      };
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('panel-filters', JSON.stringify(newFilters));
        } catch (e) {
          console.error('Failed to save filters:', e);
        }
      }
      
      return { filters: newFilters };
    });
  },

  setPRFilter: (search, state) => {
    set((store) => {
      const newFilters = {
        ...store.filters,
        pr: {
          search,
          state: state ?? store.filters.pr.state,
        },
      };
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('panel-filters', JSON.stringify(newFilters));
        } catch (e) {
          console.error('Failed to save filters:', e);
        }
      }
      
      return { filters: newFilters };
    });
  },

  clearFilters: () => {
    const defaultFilters = {
      branch: { search: '' },
      pr: { search: '', state: 'all' as const },
    };
    
    set({ filters: defaultFilters });
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('panel-filters');
      } catch (e) {
        console.error('Failed to clear filters:', e);
      }
    }
  },
}));

// Load review state from localStorage on init
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('review-states');
    if (stored) {
      const parsed = JSON.parse(stored);
      useStore.setState({ fileReviews: parsed });
    }
  } catch (e) {
    console.error('Failed to load review state:', e);
  }
}

// Load filter state from localStorage on init
if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('panel-filters');
    if (stored) {
      const parsed = JSON.parse(stored);
      useStore.setState({ filters: parsed });
    }
  } catch (e) {
    console.error('Failed to load filter state:', e);
  }

  // Clear filters on sign-out (when localStorage is cleared by Clerk)
  // Listen for storage events to detect when Clerk clears the session
  window.addEventListener('storage', (e) => {
    // If Clerk session is cleared, reset filters
    if (e.key === null || e.key?.includes('clerk')) {
      useStore.getState().clearFilters();
    }
  });
}
