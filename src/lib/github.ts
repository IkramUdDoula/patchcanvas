import { Octokit } from '@octokit/rest';
import { auth, clerkClient } from '@clerk/nextjs/server';

// Token cache with scope validation
interface CachedToken {
  token: string;
  expires: number;
  scopes: string[];
  validated: boolean;
}

const tokenCache = new Map<string, CachedToken>();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes (shorter for better refresh)
const REQUIRED_SCOPES = ['repo']; // Required scopes for private repo access

/**
 * Validate token has required scopes
 */
async function validateTokenScopes(token: string): Promise<{ valid: boolean; scopes: string[] }> {
  try {
    const octokit = new Octokit({ auth: token });
    const { headers } = await octokit.request('HEAD /');
    const scopesHeader = headers['x-oauth-scopes'] || '';
    const scopes = scopesHeader.split(',').map(s => s.trim()).filter(Boolean);
    
    console.log('Token scopes:', scopes);
    
    // Check if all required scopes are present
    const hasRequiredScopes = REQUIRED_SCOPES.every(required => 
      scopes.includes(required)
    );
    
    return { valid: hasRequiredScopes, scopes };
  } catch (error) {
    console.error('Token validation error:', error);
    return { valid: false, scopes: [] };
  }
}

/**
 * Clear token cache for user (useful when re-authentication is needed)
 */
export function clearTokenCache(userId: string) {
  tokenCache.delete(userId);
  console.log(`Cleared token cache for user: ${userId}`);
}

/**
 * Get GitHub token for authenticated user (server-side)
 */
export async function getGitHubToken(): Promise<{ token: string; userId: string } | { error: string; status: number; needsReauth?: boolean }> {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Unauthorized', status: 401 };
  }

  // Check cache and validate
  const cached = tokenCache.get(userId);
  if (cached && cached.expires > Date.now() && cached.validated) {
    return { token: cached.token, userId };
  }

  try {
    const client = await clerkClient();
    const tokenResponse = await client.users.getUserOauthAccessToken(userId, 'oauth_github');

    if (!tokenResponse?.data?.[0]?.token) {
      return { 
        error: 'No GitHub token found. Please connect your GitHub account.', 
        status: 401,
        needsReauth: true 
      };
    }

    const token = tokenResponse.data[0].token;

    // Validate token has required scopes
    const { valid, scopes } = await validateTokenScopes(token);
    
    if (!valid) {
      console.warn(`Token missing required scopes. Has: [${scopes.join(', ')}], Needs: [${REQUIRED_SCOPES.join(', ')}]`);
      
      // Clear cache to force re-fetch on next request
      clearTokenCache(userId);
      
      return { 
        error: 'GitHub token lacks required permissions. Please reconnect your GitHub account with "repo" scope enabled.', 
        status: 403,
        needsReauth: true 
      };
    }

    // Cache validated token
    tokenCache.set(userId, {
      token,
      expires: Date.now() + CACHE_DURATION,
      scopes,
      validated: true,
    });

    console.log(`Token validated and cached for user: ${userId}`);
    return { token, userId };
  } catch (error) {
    console.error('GitHub token error:', error);
    
    // Clear cache on error
    clearTokenCache(userId);
    
    return { 
      error: 'Failed to fetch GitHub token', 
      status: 500 
    };
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
