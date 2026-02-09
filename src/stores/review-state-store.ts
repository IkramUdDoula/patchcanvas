/**
 * Compatibility layer - redirects to unified store
 * This file maintains backward compatibility while we migrate components
 */
import { useStore } from '@/store';

export type FileReviewState = 'not_reviewed' | 'in_review' | 'reviewed';

export interface FileReviewStatus {
  prNumber?: number;
  commitSha?: string;
  filename: string;
  state: FileReviewState;
  reviewedAt?: Date;
}

export const useReviewStateStore = (selector?: any) => {
  const store = useStore();
  
  // If selector is provided, call it with the store methods
  if (selector) {
    return selector({
      fileReviews: store.fileReviews,
      setFileReviewState: store.setFileReviewState,
      getFileReviewState: store.getFileReviewState,
      clearPRReviews: store.clearPRReviews,
      getPRReviewStates: (prNumber: number) => {
        return Object.values(store.fileReviews).filter(
          (review) => review.prNumber === prNumber
        );
      },
      getCommitReviewStates: (commitSha: string) => {
        return Object.values(store.fileReviews).filter(
          (review) => review.commitSha === commitSha
        );
      },
      setCommitFileReviewState: (commitSha: string, filename: string, state: FileReviewState) => {
        const key = `commit:${commitSha}:${filename}`;
        store.setFileReviewState(0, key, state);
      },
      getCommitFileReviewState: (commitSha: string, filename: string) => {
        const key = `commit:${commitSha}:${filename}`;
        return store.getFileReviewState(0, key);
      },
      clearCommitReviews: (commitSha: string) => {
        Object.keys(store.fileReviews).forEach((key) => {
          if (key.startsWith(`commit:${commitSha}:`)) {
            store.clearPRReviews(0);
          }
        });
      },
      loadFromStorage: () => {},
      saveToStorage: () => {},
    });
  }
  
  // Return full store if no selector
  return {
    fileReviews: store.fileReviews,
    setFileReviewState: store.setFileReviewState,
    getFileReviewState: store.getFileReviewState,
    clearPRReviews: store.clearPRReviews,
    getPRReviewStates: (prNumber: number) => {
      return Object.values(store.fileReviews).filter(
        (review) => review.prNumber === prNumber
      );
    },
    getCommitReviewStates: (commitSha: string) => {
      return Object.values(store.fileReviews).filter(
        (review) => review.commitSha === commitSha
      );
    },
    setCommitFileReviewState: (commitSha: string, filename: string, state: FileReviewState) => {
      const key = `commit:${commitSha}:${filename}`;
      store.setFileReviewState(0, key, state);
    },
    getCommitFileReviewState: (commitSha: string, filename: string) => {
      const key = `commit:${commitSha}:${filename}`;
      return store.getFileReviewState(0, key);
    },
    clearCommitReviews: (commitSha: string) => {
      Object.keys(store.fileReviews).forEach((key) => {
        if (key.startsWith(`commit:${commitSha}:`)) {
          store.clearPRReviews(0);
        }
      });
    },
    loadFromStorage: () => {},
    saveToStorage: () => {},
  };
};
