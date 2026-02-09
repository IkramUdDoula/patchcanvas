/**
 * Simplified review progress tracking
 * Removed complex intelligence layers
 */

export type PRReviewStatus = 'not_started' | 'in_progress' | 'completed' | 'in_review' | 'complete';

export interface PRReviewProgress {
  status: PRReviewStatus;
  filesReviewed: number;
  totalFiles: number;
  filesTotal: number; // Alias for totalFiles
  percentComplete: number;
}

export function calculatePRReviewProgress(
  fileReviews: Record<string, any> | any[],
  prNumber?: number,
  totalFiles?: number
): PRReviewProgress {
  // Handle array input (legacy)
  if (Array.isArray(fileReviews)) {
    const reviewedFiles = fileReviews.filter((r: any) => r.state === 'reviewed').length;
    const total = totalFiles || fileReviews.length;
    const percentComplete = total > 0 ? (reviewedFiles / total) * 100 : 0;
    
    let status: PRReviewStatus = 'not_started';
    if (reviewedFiles > 0 && reviewedFiles < total) {
      status = 'in_progress';
    } else if (reviewedFiles === total && total > 0) {
      status = 'completed';
    }
    
    return {
      status,
      filesReviewed: reviewedFiles,
      totalFiles: total,
      filesTotal: total,
      percentComplete,
    };
  }
  
  // Handle record input
  const reviewedFiles = Object.values(fileReviews).filter(
    (review: any) => review.prNumber === prNumber && review.state === 'reviewed'
  ).length;

  const total = totalFiles || 0;
  const percentComplete = total > 0 ? (reviewedFiles / total) * 100 : 0;

  let status: PRReviewStatus = 'not_started';
  if (reviewedFiles > 0 && reviewedFiles < total) {
    status = 'in_progress';
  } else if (reviewedFiles === total && total > 0) {
    status = 'completed';
  }

  return {
    status,
    filesReviewed: reviewedFiles,
    totalFiles: total,
    filesTotal: total,
    percentComplete,
  };
}
