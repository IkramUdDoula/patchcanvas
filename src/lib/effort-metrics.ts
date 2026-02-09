/**
 * Simplified effort metrics
 * Removed complex calculations
 */

export interface PREffortMetrics {
  estimatedMinutes: number;
  complexity: 'low' | 'medium' | 'high';
  filesChanged: number;
  linesChanged: number;
  largestChange: {
    filename: string;
    additions: number;
    deletions: number;
  } | null;
  filesNeedingAttention: number;
}

export function calculatePREffort(
  filesChanged: number,
  additions: number,
  deletions: number,
  files?: any[]
): PREffortMetrics {
  const linesChanged = additions + deletions;
  
  // Simple estimation: ~100 lines per 10 minutes
  const estimatedMinutes = Math.max(5, Math.ceil(linesChanged / 10));

  let complexity: 'low' | 'medium' | 'high' = 'low';
  if (filesChanged > 10 || linesChanged > 500) {
    complexity = 'high';
  } else if (filesChanged > 5 || linesChanged > 200) {
    complexity = 'medium';
  }

  // Find largest change
  let largestChange = null;
  let filesNeedingAttention = 0;
  
  if (files) {
    let maxLines = 0;
    files.forEach((file: any) => {
      const fileLines = (file.additions || 0) + (file.deletions || 0);
      if (fileLines > maxLines) {
        maxLines = fileLines;
        largestChange = {
          filename: file.filename,
          additions: file.additions || 0,
          deletions: file.deletions || 0,
        };
      }
      if (fileLines > 100) {
        filesNeedingAttention++;
      }
    });
  }

  return {
    estimatedMinutes,
    complexity,
    filesChanged,
    linesChanged,
    largestChange,
    filesNeedingAttention,
  };
}
