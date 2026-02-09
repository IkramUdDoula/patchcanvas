/**
 * Compatibility layer - redirects to unified store
 * This file maintains backward compatibility while we migrate components
 */
import { useStore } from '@/store';
import type { Repository } from '@/lib/types';

export const useRepoStore = () => {
  const store = useStore();
  
  return {
    repositories: store.repositories,
    selectedRepo: store.selectedRepo,
    selectedBranch: store.selectedBranch,
    isLoading: store.isLoading,
    error: store.error,
    
    setRepositories: store.setRepositories,
    selectRepo: store.selectRepo,
    selectBranch: store.selectBranch,
    setLoading: store.setLoading,
    setError: store.setError,
    
    // Legacy methods - now handled by React Query hooks
    fetchRepositories: async () => {
      console.warn('fetchRepositories is deprecated. Use useRepositories() hook instead.');
    },
    cloneRepository: async (repo: Repository) => {
      console.warn('cloneRepository is deprecated.');
      return { success: false, message: 'Feature removed in simplification' };
    },
  };
};
