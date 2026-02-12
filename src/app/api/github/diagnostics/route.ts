import { NextResponse } from 'next/server';
import { getGitHubToken } from '@/lib/github';
import { Octokit } from '@octokit/rest';

/**
 * GitHub token diagnostics endpoint
 * Helps debug token and scope issues
 */
export async function GET() {
  const result = await getGitHubToken();

  if ('error' in result) {
    return NextResponse.json({
      status: 'error',
      error: result.error,
      needsReauth: result.needsReauth || false,
    }, { status: result.status });
  }

  try {
    const octokit = new Octokit({ auth: result.token });
    
    // Get token scopes
    const { headers } = await octokit.request('HEAD /');
    const scopesHeader = headers['x-oauth-scopes'] || '';
    const scopes = scopesHeader.split(',').map(s => s.trim()).filter(Boolean);
    
    // Get rate limit info
    const { data: rateLimit } = await octokit.rateLimit.get();
    
    // Test private repo access
    let canAccessPrivateRepos = false;
    try {
      await octokit.repos.listForAuthenticatedUser({
        visibility: 'private',
        per_page: 1,
      });
      canAccessPrivateRepos = true;
    } catch (e) {
      canAccessPrivateRepos = false;
    }
    
    // Get user info
    const { data: user } = await octokit.users.getAuthenticated();
    
    return NextResponse.json({
      status: 'success',
      token: {
        scopes,
        hasRepoScope: scopes.includes('repo'),
        canAccessPrivateRepos,
      },
      rateLimit: {
        limit: rateLimit.rate.limit,
        remaining: rateLimit.rate.remaining,
        reset: new Date(rateLimit.rate.reset * 1000).toISOString(),
      },
      user: {
        login: user.login,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
