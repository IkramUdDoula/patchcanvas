import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Repository, Branch, Commit, PullRequest, PRDetails } from '@/lib/types';

/**
 * Unified data fetching hook using React Query
 * All GitHub data fetching in one place
 */

// Fetch repositories
export function useRepositories() {
  return useQuery({
    queryKey: ['repositories'],
    queryFn: async () => {
      const res = await fetch('/api/repos?action=list', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch repositories');
      const data = await res.json();
      return data.repositories as Repository[];
    },
  });
}

// Fetch branches
export function useBranches(owner?: string, repo?: string) {
  return useQuery({
    queryKey: ['branches', owner, repo],
    queryFn: async () => {
      const res = await fetch(`/api/repos?action=branches&owner=${owner}&repo=${repo}`);
      if (!res.ok) throw new Error('Failed to fetch branches');
      return res.json() as Promise<Branch[]>;
    },
    enabled: !!owner && !!repo,
  });
}

// Fetch commits
export function useCommits(owner?: string, repo?: string, branch?: string, page = 1) {
  return useQuery({
    queryKey: ['commits', owner, repo, branch, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        action: 'commits',
        owner: owner!,
        repo: repo!,
        page: page.toString(),
      });
      if (branch) params.append('branch', branch);

      const res = await fetch(`/api/repos?${params}`);
      if (!res.ok) throw new Error('Failed to fetch commits');
      return res.json() as Promise<{ commits: Commit[]; hasMore: boolean }>;
    },
    enabled: !!owner && !!repo,
  });
}

// Fetch commit details
export function useCommit(owner?: string, repo?: string, sha?: string) {
  return useQuery({
    queryKey: ['commit', owner, repo, sha],
    queryFn: async () => {
      const res = await fetch(`/api/repos?action=commit&owner=${owner}&repo=${repo}&sha=${sha}`);
      if (!res.ok) throw new Error('Failed to fetch commit');
      return res.json();
    },
    enabled: !!owner && !!repo && !!sha,
  });
}

// Fetch pull requests
export function usePullRequests(owner?: string, repo?: string, targetBranch?: string) {
  return useQuery({
    queryKey: ['pulls', owner, repo, targetBranch],
    queryFn: async () => {
      const params = new URLSearchParams({
        action: 'pulls',
        owner: owner!,
        repo: repo!,
      });
      if (targetBranch) params.append('targetBranch', targetBranch);

      const res = await fetch(`/api/repos?${params}`);
      if (!res.ok) throw new Error('Failed to fetch pull requests');
      return res.json() as Promise<PullRequest[]>;
    },
    enabled: !!owner && !!repo,
  });
}

// Fetch PR details
export function usePullRequest(owner?: string, repo?: string, number?: number) {
  return useQuery({
    queryKey: ['pr', owner, repo, number],
    queryFn: async () => {
      const res = await fetch(`/api/repos?action=pr&owner=${owner}&repo=${repo}&number=${number}`);
      if (!res.ok) throw new Error('Failed to fetch PR details');
      return res.json() as Promise<PRDetails>;
    },
    enabled: !!owner && !!repo && !!number,
  });
}

// Fetch PR files
export function usePRFiles(owner?: string, repo?: string, number?: number) {
  return useQuery({
    queryKey: ['pr-files', owner, repo, number],
    queryFn: async () => {
      const res = await fetch(`/api/repos?action=pr-files&owner=${owner}&repo=${repo}&number=${number}`);
      if (!res.ok) throw new Error('Failed to fetch PR files');
      return res.json();
    },
    enabled: !!owner && !!repo && !!number,
  });
}

// Fetch PR commits
export function usePRCommits(owner?: string, repo?: string, number?: number) {
  return useQuery({
    queryKey: ['pr-commits', owner, repo, number],
    queryFn: async () => {
      const res = await fetch(`/api/repos?action=pr-commits&owner=${owner}&repo=${repo}&number=${number}`);
      if (!res.ok) throw new Error('Failed to fetch PR commits');
      return res.json();
    },
    enabled: !!owner && !!repo && !!number,
  });
}

// Fetch diff
export function useDiff(owner?: string, repo?: string, base?: string, head?: string) {
  return useQuery({
    queryKey: ['diff', owner, repo, base, head],
    queryFn: async () => {
      const res = await fetch(`/api/repos?action=diff&owner=${owner}&repo=${repo}&base=${base}&head=${head}`);
      if (!res.ok) throw new Error('Failed to fetch diff');
      return res.json();
    },
    enabled: !!owner && !!repo && !!base && !!head,
  });
}

// Merge PR mutation
export function useMergePR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      owner,
      repo,
      number,
      commit_title,
      commit_message,
      merge_method,
    }: {
      owner: string;
      repo: string;
      number: number;
      commit_title?: string;
      commit_message?: string;
      merge_method?: 'merge' | 'squash' | 'rebase';
    }) => {
      const res = await fetch(`/api/repos?action=merge&owner=${owner}&repo=${repo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, commit_title, commit_message, merge_method }),
      });
      if (!res.ok) throw new Error('Failed to merge PR');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pulls', variables.owner, variables.repo] });
      queryClient.invalidateQueries({ queryKey: ['pr', variables.owner, variables.repo, variables.number] });
    },
  });
}

// Close PR mutation
export function useClosePR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      owner,
      repo,
      number,
    }: {
      owner: string;
      repo: string;
      number: number;
    }) => {
      const res = await fetch(`/api/repos?action=close&owner=${owner}&repo=${repo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number }),
      });
      if (!res.ok) throw new Error('Failed to close PR');
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pulls', variables.owner, variables.repo] });
      queryClient.invalidateQueries({ queryKey: ['pr', variables.owner, variables.repo, variables.number] });
    },
  });
}
