/**
 * Simplified commit intelligence
 * Removed complex analysis layers
 */

export type CommitType = 'feature' | 'fix' | 'refactor' | 'docs' | 'test' | 'chore' | 'merge' | 'other' | 'behavioral' | 'cleanup' | 'mechanical';

export interface CommitIntelligence {
  type: CommitType;
  role: CommitType; // Alias for type
  scope?: string;
  breaking: boolean;
  linesAdded: number;
  linesRemoved: number;
  netChange: number;
  whyExists: string;
  focusAreas: string[];
}

export function classifyCommit(message: string): CommitType {
  const lower = message.toLowerCase();
  
  if (lower.includes('merge')) return 'merge';
  if (lower.startsWith('feat') || lower.includes('feature')) return 'feature';
  if (lower.startsWith('fix') || lower.includes('bug')) return 'fix';
  if (lower.startsWith('refactor')) return 'refactor';
  if (lower.startsWith('docs')) return 'docs';
  if (lower.startsWith('test')) return 'test';
  if (lower.startsWith('chore')) return 'chore';
  
  return 'other';
}

export function calculateCommitIntelligence(message: string, files?: any[]): CommitIntelligence {
  const type = classifyCommit(message);
  const breaking = message.includes('BREAKING CHANGE') || message.includes('!:');
  
  // Extract scope if present (e.g., "feat(api): add endpoint")
  const scopeMatch = message.match(/\(([^)]+)\)/);
  const scope = scopeMatch ? scopeMatch[1] : undefined;
  
  // Calculate line changes from files
  let linesAdded = 0;
  let linesRemoved = 0;
  const focusAreas: string[] = [];
  
  if (files) {
    files.forEach((file: any) => {
      linesAdded += file.additions || 0;
      linesRemoved += file.deletions || 0;
      
      // Extract focus areas from file paths
      const parts = file.filename.split('/');
      if (parts.length > 1 && !focusAreas.includes(parts[0])) {
        focusAreas.push(parts[0]);
      }
    });
  }
  
  const netChange = linesAdded - linesRemoved;
  
  // Generate why exists message
  const whyExists = `${getCommitRoleLabel(type)} commit with ${linesAdded} additions and ${linesRemoved} deletions`;
  
  return {
    type,
    role: type, // Alias
    scope,
    breaking,
    linesAdded,
    linesRemoved,
    netChange,
    whyExists,
    focusAreas,
  };
}

export function getCommitRoleLabel(type: CommitType): string {
  const labels: Record<CommitType, string> = {
    feature: 'Feature',
    fix: 'Fix',
    refactor: 'Refactor',
    docs: 'Docs',
    test: 'Test',
    chore: 'Chore',
    merge: 'Merge',
    other: 'Other',
    behavioral: 'Feature',
    cleanup: 'Cleanup',
    mechanical: 'Fix',
  };
  
  return labels[type] || 'Other';
}

// Alias for compatibility
export const getRoleBadgeStyle = getCommitRoleBadgeStyle;
export const getScopeBadgeStyle = getCommitScopeBadgeStyle;

export function getCommitScopeLabel(scope?: string): string {
  return scope || 'General';
}

export function getCommitRoleBadgeStyle(type: CommitType): string {
  const styles: Record<CommitType, string> = {
    feature: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    fix: 'bg-red-500/10 text-red-500 border-red-500/20',
    refactor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    docs: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    test: 'bg-green-500/10 text-green-500 border-green-500/20',
    chore: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    merge: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    other: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    behavioral: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    cleanup: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    mechanical: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  
  return styles[type];
}

export function getCommitScopeBadgeStyle(): string {
  return 'bg-muted text-muted-foreground border-border';
}
