import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { getGitHubToken } from '@/lib/github';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const { number } = await params;
  const prNumber = parseInt(number);

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
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    return NextResponse.json({
      number: pr.number,
      title: pr.title,
      body: pr.body,
      state: pr.state,
      draft: pr.draft,
      merged: pr.merged,
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
      additions: pr.additions,
      deletions: pr.deletions,
      changed_files: pr.changed_files,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PR details' },
      { status: 500 }
    );
  }
}
