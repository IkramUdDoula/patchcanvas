// Authentication Types
export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: GitHubUser | null;
  isLoading: boolean;
  error: string | null;
}

// Repository Types
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  default_branch: string;
  clone_url: string;
  isCloned: boolean;
  localPath: string | null;
  private?: boolean;
  description?: string | null;
  updated_at?: string;
}

export interface RepositoryState {
  repositories: Repository[];
  selectedRepo: Repository | null;
  isLoading: boolean;
  error: string | null;
}

// Git Types
export interface Branch {
  name: string;
  commit: {
    sha: string;
    date: string;
  };
  protected?: boolean;
  isDefault: boolean;
  prCount?: number;
}

export interface Commit {
  sha: string;
  abbreviatedSha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
    avatar_url?: string;
  };
  committer?: {
    name: string;
    date: string;
  };
  parents?: string[];
  isMergeCommit?: boolean;
  files?: CommitFile[];
  // PR association
  associatedPR?: {
    number: number;
    state: 'open' | 'closed' | 'merged';
  };
  // Merge status
  isInDefaultBranch?: boolean;
}

export interface CommitFile {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;
}

export interface PRFile {
  filename: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  blob_url: string;
  raw_url: string;
  previous_filename?: string;
}

// Diff Types
export interface FileDiff {
  path: string;
  oldPath: string | null;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  hunks: Hunk[];
}

export interface Hunk {
  id: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'context' | 'add' | 'delete';
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
}

// Review Types
export interface User {
  id: number;
  login: string;
  avatar_url: string;
  name?: string | null;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

export interface Milestone {
  id: number;
  number: number;
  title: string;
  description: string | null;
  state: 'open' | 'closed';
  due_on: string | null;
}

export interface Team {
  id: number;
  name: string;
  slug: string;
}

export interface PullRequest {
  number: number;
  title: string;
  sourceBranch: string;
  targetBranch: string;
  author: {
    login: string;
    avatar_url: string;
  };
  state: 'open' | 'closed' | 'merged';
  draft: boolean;
  hasConflicts: boolean;
  commits?: Commit[];
  createdAt: string;
  updatedAt: string;
  mergedAt?: string | null;
  closedAt?: string | null;
  // Review cost metrics
  changed_files?: number;
  additions?: number;
  deletions?: number;
  commits_count?: number;
}

export interface PRDetails extends PullRequest {
  body: string;
  mergeable: boolean | null;
  mergeable_state: 'clean' | 'dirty' | 'unstable' | 'blocked' | 'unknown';
  rebaseable: boolean | null;
  merge_commit_sha: string | null;
  comments: number;
  review_comments: number;
  commits_count: number;
  additions: number;
  deletions: number;
  changed_files: number;
  labels: Label[];
  milestone: Milestone | null;
  assignees: User[];
  requested_reviewers: User[];
  requested_teams: Team[];
}

export interface PRReview {
  id: number;
  user: User;
  body: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING' | 'DISMISSED';
  submitted_at: string | null;
  commit_id: string;
}

export interface CheckRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
  started_at: string;
  completed_at: string | null;
  html_url: string;
  output: {
    title: string;
    summary: string;
  };
}

export type TimelineEventType = 
  | 'committed'
  | 'reviewed'
  | 'commented'
  | 'merged'
  | 'closed'
  | 'reopened'
  | 'labeled'
  | 'unlabeled'
  | 'assigned'
  | 'unassigned'
  | 'review_requested'
  | 'review_request_removed'
  | 'head_ref_force_pushed'
  | 'base_ref_changed'
  | 'referenced'
  | 'cross-referenced';

export interface TimelineEvent {
  id: string | number;
  event: TimelineEventType;
  actor: User | null;
  created_at: string;
  commit_id?: string;
  body?: string;
  label?: Label;
  assignee?: User;
  reviewer?: User;
  review?: PRReview;
  commit_url?: string;
  sha?: string;
  message?: string;
}

export interface ReviewState {
  pullRequest: PullRequest | null;
  reviewBranch: string | null;
  fileDiffs: FileDiff[];
  selectedItems: SelectedItem[];
  auditLog: AuditEntry[];
}

export interface SelectedItem {
  type: 'file' | 'hunk';
  fileId: string;
  hunkId?: string;
  includedAt: Date;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: 'include' | 'exclude' | 'edit';
  itemType: 'file' | 'hunk';
  filePath: string;
  hunkId?: string;
  details?: string;
}
