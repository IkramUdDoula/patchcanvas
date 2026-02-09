/**
 * Simplified PR intelligence
 * Removed complex analysis layers
 */

export type PRCostLevel = 'low' | 'medium' | 'high' | 'very-high';
export type PRRiskLevel = 'low' | 'medium' | 'high';

export interface ChangeBreakdown {
  additions: number;
  deletions: number;
  filesChanged: number;
  ui: number;
  logic: number;
  shared: number;
}

export interface CommitComposition {
  totalCommits: number;
  authors: string[];
  behavioral: number;
  refactor: number;
  mechanical: number;
}

export function analyzeChangeBreakdown(
  additions: number,
  deletions: number,
  filesChanged: number,
  files?: any[]
): ChangeBreakdown {
  let ui = 0;
  let logic = 0;
  let shared = 0;
  
  // Categorize files
  if (files) {
    files.forEach((file: any) => {
      const path = file.filename.toLowerCase();
      if (path.includes('component') || path.includes('ui') || path.includes('.tsx') || path.includes('.jsx')) {
        ui++;
      } else if (path.includes('lib') || path.includes('util') || path.includes('shared') || path.includes('common')) {
        shared++;
      } else {
        logic++;
      }
    });
  }
  
  return {
    additions,
    deletions,
    filesChanged,
    ui,
    logic,
    shared,
  };
}

export function analyzeCommitComposition(commits: any[]): CommitComposition {
  const authors = [...new Set(commits.map((c) => c.author?.login || 'unknown'))];
  
  let behavioral = 0;
  let refactor = 0;
  let mechanical = 0;
  
  commits.forEach((commit: any) => {
    const message = commit.commit?.message || commit.message || '';
    const lower = message.toLowerCase();
    
    if (lower.includes('feat') || lower.includes('feature')) {
      behavioral++;
    } else if (lower.includes('refactor')) {
      refactor++;
    } else if (lower.includes('fix') || lower.includes('bug')) {
      mechanical++;
    }
  });
  
  return {
    totalCommits: commits.length,
    authors,
    behavioral,
    refactor,
    mechanical,
  };
}

export function calculatePRCost(
  filesChanged: number,
  linesChanged: number
): PRCostLevel {
  if (filesChanged > 20 || linesChanged > 1000) return 'very-high';
  if (filesChanged > 10 || linesChanged > 500) return 'high';
  if (filesChanged > 5 || linesChanged > 200) return 'medium';
  return 'low';
}

export function calculatePRRisk(
  filesChanged: number,
  hasConflicts: boolean
): PRRiskLevel {
  if (hasConflicts || filesChanged > 20) return 'high';
  if (filesChanged > 10) return 'medium';
  return 'low';
}

export function calculatePRIntelligence(
  additions: number,
  deletions: number,
  filesChanged: number,
  hasConflicts: boolean,
  files: any[],
  commits: any[]
) {
  const linesChanged = additions + deletions;
  
  return {
    cost: calculatePRCost(filesChanged, linesChanged),
    risk: calculatePRRisk(filesChanged, hasConflicts),
    changeBreakdown: analyzeChangeBreakdown(additions, deletions, filesChanged, files),
    commitComposition: analyzeCommitComposition(commits),
    riskSignals: [] as any[], // Simplified - no risk signals
    guidance: {
      mostSensitiveBehavior: 'Review carefully',
      reviewOrderHint: 'Start with shared components',
      suggestedStartCommit: commits[0] || null,
      highestImpactArea: files[0]?.filename.split('/')[0] || 'Unknown',
      filesNeedingAttention: filesChanged,
    },
  };
}
