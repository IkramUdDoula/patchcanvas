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
    const { data: reviews } = await octokit.pulls.listReviews({
      owner,
      repo,
      pull_number: prNumber,
    });

    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      user: {
        login: review.user?.login || 'unknown',
        avatar_url: review.user?.avatar_url || '',
      },
      state: review.state,
      body: review.body,
      submitted_at: review.submitted_at,
    }));

    return NextResponse.json(formattedReviews);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PR reviews' },
      { status: 500 }
    );
  }
}
