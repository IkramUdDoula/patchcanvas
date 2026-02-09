import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { getGitHubToken } from '@/lib/github';

/**
 * Consolidated Repository API endpoint
 * Handles: repos list, branches, commits, pulls, diff, merge operations
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  const result = await getGitHubToken();
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const octokit = new Octokit({ auth: result.token });

  try {
    // List repositories
    if (action === 'list') {
      // Debug: Check token scopes
      try {
        const { headers } = await octokit.request('HEAD /');
        const scopes = headers['x-oauth-scopes'];
        console.log('GitHub OAuth Scopes:', scopes);
      } catch (e) {
        console.error('Failed to check scopes:', e);
      }

      const { data: repos } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100,
        visibility: 'all',
        affiliation: 'owner,collaborator,organization_member',
      });

      const repositories = repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        owner: repo.owner.login,
        default_branch: repo.default_branch,
        clone_url: repo.clone_url,
        private: repo.private,
        description: repo.description,
        updated_at: repo.updated_at,
      }));

      return NextResponse.json({ repositories });
    }

    // All other actions require owner and repo
    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Missing owner or repo parameter' },
        { status: 400 }
      );
    }

    // Get branches
    if (action === 'branches') {
      const { data: branches } = await octokit.repos.listBranches({
        owner,
        repo,
        per_page: 100,
      });

      const { data: repoData } = await octokit.repos.get({ owner, repo });

      const formattedBranches = branches.map((branch) => ({
        name: branch.name,
        commit: {
          sha: branch.commit.sha,
          date: new Date().toISOString(),
        },
        isDefault: branch.name === repoData.default_branch,
      }));

      return NextResponse.json(formattedBranches);
    }

    // Get commits
    if (action === 'commits') {
      const branch = searchParams.get('branch');
      const page = parseInt(searchParams.get('page') || '1');
      const perPage = parseInt(searchParams.get('per_page') || '30');

      const { data: commits } = await octokit.repos.listCommits({
        owner,
        repo,
        sha: branch || undefined,
        page,
        per_page: perPage,
      });

      // Fetch associated PRs for all commits in parallel
      const formattedCommitsPromises = commits.map(async (commit) => {
        let associatedPR = null;
        try {
          const { data: prs } = await octokit.repos.listPullRequestsAssociatedWithCommit({
            owner,
            repo,
            commit_sha: commit.sha,
          });
          if (prs.length > 0) {
            const pr = prs[0];
            associatedPR = {
              number: pr.number,
              state: pr.merged_at ? 'merged' : pr.state,
            };
          }
        } catch (e) {
          // Ignore errors - commit might not be in a PR
        }

        return {
          sha: commit.sha,
          abbreviatedSha: commit.sha.substring(0, 7),
          message: commit.commit.message,
          author: {
            name: commit.commit.author?.name || 'Unknown',
            email: commit.commit.author?.email || '',
            date: commit.commit.author?.date || '',
            avatar_url: commit.author?.avatar_url || null,
            login: commit.author?.login || null,
          },
          committer: {
            name: commit.commit.committer?.name || 'Unknown',
            date: commit.commit.committer?.date || '',
          },
          parents: commit.parents.map((p) => p.sha),
          url: commit.html_url,
          associatedPR,
        };
      });

      const formattedCommits = await Promise.all(formattedCommitsPromises);

      return NextResponse.json({
        commits: formattedCommits,
        page,
        perPage,
        hasMore: commits.length === perPage,
      });
    }

    // Get commit details
    if (action === 'commit') {
      const sha = searchParams.get('sha');
      if (!sha) {
        return NextResponse.json({ error: 'Missing sha parameter' }, { status: 400 });
      }

      const { data: commit } = await octokit.repos.getCommit({
        owner,
        repo,
        ref: sha,
      });

      // Check if commit is associated with a PR
      let associatedPR = null;
      try {
        const { data: prs } = await octokit.repos.listPullRequestsAssociatedWithCommit({
          owner,
          repo,
          commit_sha: sha,
        });
        if (prs.length > 0) {
          const pr = prs[0];
          associatedPR = {
            number: pr.number,
            state: pr.merged_at ? 'merged' : pr.state,
          };
        }
      } catch (e) {
        // Ignore errors - commit might not be in a PR
      }

      // Check if commit is in default branch
      let isInDefaultBranch = false;
      try {
        const { data: repoData } = await octokit.repos.get({ owner, repo });
        const { data: comparison } = await octokit.repos.compareCommits({
          owner,
          repo,
          base: repoData.default_branch,
          head: sha,
        });
        isInDefaultBranch = comparison.status === 'identical' || comparison.status === 'behind';
      } catch (e) {
        // Ignore errors
      }

      return NextResponse.json({
        sha: commit.sha,
        abbreviatedSha: commit.sha.substring(0, 7),
        message: commit.commit.message,
        author: {
          name: commit.commit.author?.name || 'Unknown',
          email: commit.commit.author?.email || '',
          date: commit.commit.author?.date || '',
          avatar_url: commit.author?.avatar_url || null,
        },
        committer: commit.commit.committer ? {
          name: commit.commit.committer.name,
          date: commit.commit.committer.date,
        } : undefined,
        parents: commit.parents?.map(p => p.sha) || [],
        isMergeCommit: (commit.parents?.length || 0) > 1,
        files: commit.files?.map(f => ({
          filename: f.filename,
          status: f.status as 'added' | 'modified' | 'deleted' | 'renamed',
          additions: f.additions,
          deletions: f.deletions,
          changes: f.changes,
          patch: f.patch,
        })) || [],
        associatedPR,
        isInDefaultBranch,
      });
    }

    // Get pull requests
    if (action === 'pulls') {
      const targetBranch = searchParams.get('targetBranch');
      const state = searchParams.get('state') || 'all';

      const { data: pulls } = await octokit.pulls.list({
        owner,
        repo,
        state: state as 'open' | 'closed' | 'all',
        per_page: 100,
      });

      let filtered = pulls;
      if (targetBranch) {
        filtered = pulls.filter((pr) => pr.base.ref === targetBranch);
      }

      const formattedPRs = filtered.map((pr) => ({
        number: pr.number,
        title: pr.title,
        author: {
          login: pr.user?.login || 'unknown',
          avatar_url: pr.user?.avatar_url || '',
        },
        state: pr.state,
        draft: pr.draft,
        hasConflicts: (pr as any).mergeable === false,
        targetBranch: pr.base.ref,
        sourceBranch: pr.head.ref,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        mergedAt: pr.merged_at,
        closedAt: pr.closed_at,
      }));

      return NextResponse.json(formattedPRs);
    }

    // Get PR details
    if (action === 'pr') {
      const prNumber = searchParams.get('number');
      if (!prNumber) {
        return NextResponse.json({ error: 'Missing number parameter' }, { status: 400 });
      }

      const { data: pr } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: parseInt(prNumber),
      });

      return NextResponse.json({
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.state,
        draft: pr.draft,
        mergeable: pr.mergeable,
        mergeable_state: pr.mergeable_state,
        author: {
          login: pr.user?.login || 'unknown',
          avatar_url: pr.user?.avatar_url || '',
        },
        targetBranch: pr.base.ref,
        sourceBranch: pr.head.ref,
        createdAt: pr.created_at,
        updatedAt: pr.updated_at,
        mergedAt: pr.merged_at,
        closedAt: pr.closed_at,
        changed_files: pr.changed_files,
        additions: pr.additions,
        deletions: pr.deletions,
        commits: pr.commits,
      });
    }

    // Get PR files
    if (action === 'pr-files') {
      const prNumber = searchParams.get('number');
      if (!prNumber) {
        return NextResponse.json({ error: 'Missing number parameter' }, { status: 400 });
      }

      const { data: files } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: parseInt(prNumber),
        per_page: 100,
      });

      return NextResponse.json(files);
    }

    // Get PR commits
    if (action === 'pr-commits') {
      const prNumber = searchParams.get('number');
      if (!prNumber) {
        return NextResponse.json({ error: 'Missing number parameter' }, { status: 400 });
      }

      const prNum = parseInt(prNumber);

      // First, get the PR details to know its state
      const { data: pr } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: prNum,
      });

      const { data: commits } = await octokit.pulls.listCommits({
        owner,
        repo,
        pull_number: prNum,
        per_page: 100,
      });

      const formattedCommits = commits.map((commit) => ({
        sha: commit.sha,
        abbreviatedSha: commit.sha.substring(0, 7),
        message: commit.commit.message,
        author: {
          name: commit.commit.author?.name || 'Unknown',
          email: commit.commit.author?.email || '',
          date: commit.commit.author?.date || '',
          avatar_url: commit.author?.avatar_url || null,
          login: commit.author?.login || null,
        },
        committer: {
          name: commit.commit.committer?.name || 'Unknown',
          date: commit.commit.committer?.date || '',
        },
        parents: commit.parents.map((p) => p.sha),
        url: commit.html_url,
        // Add associated PR info since we know these commits are from this PR
        associatedPR: {
          number: prNum,
          state: pr.merged_at ? 'merged' : pr.state,
        },
      }));

      return NextResponse.json(formattedCommits);
    }

    // Get diff
    if (action === 'diff') {
      const base = searchParams.get('base');
      const head = searchParams.get('head');

      if (!base || !head) {
        return NextResponse.json(
          { error: 'Missing base or head parameter' },
          { status: 400 }
        );
      }

      const { data: comparison } = await octokit.repos.compareCommits({
        owner,
        repo,
        base,
        head,
      });

      return NextResponse.json({
        files: comparison.files,
        commits: comparison.commits,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API error:', error);
    
    // Check for scope/permission errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isPermissionError = errorMessage.toLowerCase().includes('scope') || 
                              errorMessage.toLowerCase().includes('permission') ||
                              errorMessage.toLowerCase().includes('forbidden') ||
                              (error as any)?.status === 403;
    
    if (isPermissionError) {
      return NextResponse.json(
        {
          error: 'GitHub token lacks required permissions',
          details: 'Your GitHub connection needs the "repo" scope to access private repositories. Please reconnect your GitHub account.',
          needsReauth: true,
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      {
        error: 'API request failed',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// POST for write operations
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'Missing owner or repo parameter' },
      { status: 400 }
    );
  }

  const result = await getGitHubToken();
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const octokit = new Octokit({ auth: result.token });

  try {
    const body = await request.json();

    // Merge PR
    if (action === 'merge') {
      const { number, commit_title, commit_message, merge_method } = body;

      const { data } = await octokit.pulls.merge({
        owner,
        repo,
        pull_number: number,
        commit_title,
        commit_message,
        merge_method: merge_method || 'merge',
      });

      return NextResponse.json(data);
    }

    // Close PR
    if (action === 'close') {
      const { number } = body;

      const { data } = await octokit.pulls.update({
        owner,
        repo,
        pull_number: number,
        state: 'closed',
      });

      return NextResponse.json(data);
    }

    // Create PR
    if (action === 'create-pr') {
      const { title, body: prBody, head, base } = body;

      const { data } = await octokit.pulls.create({
        owner,
        repo,
        title,
        body: prBody,
        head,
        base,
      });

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'API request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
