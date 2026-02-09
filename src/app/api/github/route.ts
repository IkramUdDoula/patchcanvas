import { NextResponse } from 'next/server';
import { getGitHubToken } from '@/lib/github';

/**
 * Consolidated GitHub API endpoint
 * Handles: token retrieval
 */
export async function GET() {
  const result = await getGitHubToken();
  
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ token: result.token });
}
