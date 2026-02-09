import { Octokit } from '@octokit/rest';
import { auth, clerkClient } from '@clerk/nextjs/server';

// Simple token cache (in-memory)
const tokenCache = new Map<string, { token: string; expires: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get GitHub token for authenticated user (server-side)
 */
export async function getGitHubToken(): Promise<{ token: string; userId: string } | { error: string; status: number }> {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Unauthorized', status: 401 };
  }

  // Check cache
  const cached = tokenCache.get(userId);
  if (cached && cached.expires > Date.now()) {
    return { token: cached.token, userId };
  }

  try {
    const client = await clerkClient();
    const tokenResponse = await client.users.getUserOauthAccessToken(userId, 'oauth_github');

    if (!tokenResponse?.data?.[0]?.token) {
      return { error: 'No GitHub token found', status: 401 };
    }

    const token = tokenResponse.data[0].token;

    // Cache token
    tokenCache.set(userId, {
      token,
      expires: Date.now() + CACHE_DURATION,
    });

    return { token, userId };
  } catch (error) {
    console.error('GitHub token error:', error);
    return { error: 'Failed to fetch GitHub token', status: 500 };
  }
}

/**
 * Create Octokit client (server-side)
 */
export async function getOctokit(): Promise<Octokit | null> {
  const result = await getGitHubToken();
  if ('error' in result) {
    return null;
  }
  return new Octokit({ auth: result.token });
}

/**
 * Create Octokit client with token (client-side)
 */
export async function getOctokitClient(): Promise<Octokit | null> {
  try {
    const response = await fetch('/api/github/token');
    if (!response.ok) return null;

    const { token } = await response.json();
    return new Octokit({ auth: token });
  } catch (error) {
    console.error('Error creating GitHub client:', error);
    return null;
  }
}
