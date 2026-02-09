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
    // Get PR details to get the head SHA
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    // Get check runs for the head SHA
    const { data: checkRuns } = await octokit.checks.listForRef({
      owner,
      repo,
      ref: pr.head.sha,
    });

    const formattedChecks = checkRuns.check_runs.map((check) => ({
      id: check.id,
      name: check.name,
      status: check.status,
      conclusion: check.conclusion,
      started_at: check.started_at,
      completed_at: check.completed_at,
      html_url: check.html_url,
    }));

    return NextResponse.json(formattedChecks);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PR checks' },
      { status: 500 }
    );
  }
}
