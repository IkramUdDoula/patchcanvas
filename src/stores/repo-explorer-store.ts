/**
 * Compatibility layer - redirects to unified store
 * This file maintains backward compatibility while we migrate components
 */
import { useStore } from '@/store';
import { useParams } from 'next/navigation';

export const useRepoExplorerStore = () => {
  const store = useStore();
  const params = useParams();
  
  // Extract owner and repo from URL params
  const owner = params?.owner as string || '';
  const repo = params?.name as string || '';
  
  return {
    // Map old store methods to new unified store
    owner,
    repo,
    expandedBranches: store.expandedBranches,
    expandedPRs: store.expandedPRs,
    expandedCommits: store.expandedCommits,
    selectedItem: store.selectedItem,
    selection: store.selectedItem, // Alias for compatibility
    filters: store.filters,
    toggleBranch: store.toggleBranch,
    togglePR: store.togglePR,
    toggleCommit: store.toggleCommit,
    selectItem: store.selectItem,
    setBranchFilter: store.setBranchFilter,
    setPRFilter: store.setPRFilter,
    clearFilters: store.clearFilters,
    selectBranch: (branchName: string) => {
      store.selectItem({ type: 'branch', branchName });
    },
    selectPR: (prNumber: number) => {
      // Preserve the current branch context when selecting a PR
      const currentBranch = store.selectedItem?.branchName;
      store.selectItem({ type: 'pr', prNumber, branchName: currentBranch, baseBranch: currentBranch });
    },
    selectCommit: (commitSha: string) => {
      // Preserve the current branch and PR context when selecting a commit
      const currentBranch = store.selectedItem?.branchName || store.selectedItem?.baseBranch;
      const currentPR = store.selectedItem?.prNumber;
      store.selectItem({ 
        type: 'commit', 
        commitSha, 
        branchName: currentBranch, 
        baseBranch: currentBranch,
        prNumber: currentPR 
      });
    },
    selectFile: (filePath: string) => {
      // Preserve the current commit, branch, and PR context when selecting a file
      const currentCommit = store.selectedItem?.commitSha;
      const currentBranch = store.selectedItem?.branchName || store.selectedItem?.baseBranch;
      const currentPR = store.selectedItem?.prNumber;
      store.selectItem({ 
        type: 'file', 
        filePath, 
        commitSha: currentCommit, 
        branchName: currentBranch, 
        baseBranch: currentBranch,
        prNumber: currentPR
      });
    },
    clearSelection: store.clearSelection,
    setRepoContext: (owner: string, repo: string) => {
      // No-op: context comes from URL params now
    },
    panels: {
      branch: true,
      pr: true,
      commit: true,
      file: true,
    },
    togglePanel: (panel: string) => {
      // No-op: panels always visible in simplified version
    },
  };
};
